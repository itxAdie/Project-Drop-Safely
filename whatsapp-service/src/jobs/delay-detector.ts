import cron from "node-cron";
import pino from "pino";
import { MongoClient, ObjectId } from "mongodb";
import { haversineDistance } from "./billing-reminder.js";

const logger = pino({ level: process.env.NODE_ENV === "development" ? "debug" : "info" });

const MONGODB_URI = process.env.MONGODB_URI || "";
const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || "http://localhost:3001";
const WHATSAPP_SERVICE_SECRET = process.env.WHATSAPP_SERVICE_SECRET || "";
const MAIN_APP_URL = process.env.MAIN_APP_URL || "http://localhost:3000";

const DELAY_THRESHOLD_MINUTES = 10;

interface GpsPoint {
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  timestamp: Date;
}

interface TripStudent {
  studentId: ObjectId;
  status: string;
}

/**
 * Delay Detector Job
 *
 * Runs every 5 minutes during active transport hours (6 AM - 6 PM PKT).
 *
 * Checks active trips: compare driver's last GPS location against
 * expected route progress. If driver is significantly behind schedule
 * (> 10 min), triggers delay notification.
 */
export function startDelayDetector(): void {
  // Every 5 minutes, 6 AM - 6 PM in Asia/Karachi timezone
  cron.schedule(
    "*/5 6-18 * * *",
    async () => {
      logger.info("Delay detection job triggered");

      if (!MONGODB_URI) {
        logger.error("MONGODB_URI not configured — skipping delay detection");
        return;
      }

      let client: MongoClient | null = null;

      try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db();

        // Find all active trips (in_progress)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const trips = await db
          .collection("trips")
          .find({
            status: "in_progress",
            date: { $gte: today, $lt: tomorrow },
          })
          .toArray();

        logger.info(`Found ${trips.length} active trips to check`);

        for (const trip of trips) {
          try {
            // Get driver's current location
            const driver = await db
              .collection("drivers")
              .findOne({ _id: trip.driverId });

            if (!driver?.currentLocation?.coordinates) {
              continue;
            }

            const [driverLng, driverLat] = driver.currentLocation.coordinates;

            // Get driver's last GPS update time
            const lastUpdate = driver.lastLocationUpdate
              ? new Date(driver.lastLocationUpdate)
              : null;

            // If driver hasn't updated location in 10+ minutes, skip
            if (
              lastUpdate &&
              Date.now() - lastUpdate.getTime() > 10 * 60 * 1000
            ) {
              logger.debug(
                `Driver ${String(trip.driverId)} location stale — skipping`,
              );
              continue;
            }

            // Get route to check expected pickup sequence
            const route = await db
              .collection("routes")
              .findOne({ _id: trip.routeId });

            if (!route) continue;

            // Check pending students — if driver is far from next pickup
            const pendingStudents = (trip.students as TripStudent[]).filter(
              (s: TripStudent) => s.status === "pending",
            );

            if (pendingStudents.length === 0) continue;

            // Get the next pending student's location
            const nextStudent = await db
              .collection("students")
              .findOne({ _id: pendingStudents[0].studentId });

            if (!nextStudent?.pickupLocation?.coordinates) continue;

            const [studentLng, studentLat] =
              nextStudent.pickupLocation.coordinates;

            // Calculate distance to next pickup
            const distanceKm = haversineDistance(
              driverLat,
              driverLng,
              studentLat,
              studentLng,
            );

            // Rough estimate: assume average speed of 30 km/h in city
            const estimatedMinutesAway = (distanceKm / 30) * 60;

            // Check if trip started long enough ago that this is a delay
            const tripStartedAt = trip.startedAt
              ? new Date(trip.startedAt)
              : null;

            if (!tripStartedAt) continue;

            const elapsedMinutes =
              (Date.now() - tripStartedAt.getTime()) / (60 * 1000);

            // If elapsed time significantly exceeds expected and we haven't
            // already flagged a delay, trigger notification
            const currentDelay = trip.delayMinutes || 0;

            if (
              estimatedMinutesAway > DELAY_THRESHOLD_MINUTES &&
              elapsedMinutes > DELAY_THRESHOLD_MINUTES &&
              currentDelay < DELAY_THRESHOLD_MINUTES
            ) {
              const delayMinutes = Math.round(estimatedMinutesAway);
              const newEta = new Date(
                Date.now() + delayMinutes * 60 * 1000,
              ).toLocaleTimeString("en-PK", {
                hour: "2-digit",
                minute: "2-digit",
              });

              // Update trip delay
              await db
                .collection("trips")
                .updateOne(
                  { _id: trip._id },
                  { $set: { delayMinutes } },
                );

              // Notify main app to trigger notifications
              try {
                await fetch(
                  `${MAIN_APP_URL}/api/internal/trips/${String(trip._id)}/delay`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-api-secret": WHATSAPP_SERVICE_SECRET,
                    },
                    body: JSON.stringify({ delayMinutes }),
                    signal: AbortSignal.timeout(5000),
                  },
                );
              } catch {
                // If main app call fails, send WhatsApp directly
                for (const entry of pendingStudents) {
                  const student = await db
                    .collection("students")
                    .findOne({ _id: entry.studentId });

                  if (student?.parentPhone) {
                    await fetch(
                      `${WHATSAPP_SERVICE_URL}/api/send-notification`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "x-api-secret": WHATSAPP_SERVICE_SECRET,
                        },
                        body: JSON.stringify({
                          phone: student.parentPhone,
                          type: "delay",
                          data: {
                            routeName: route.name || "Your route",
                            minutes: delayMinutes,
                            reason: "Traffic delay",
                            newEta,
                          },
                        }),
                        signal: AbortSignal.timeout(5000),
                      },
                    ).catch((err: Error) => {
                      logger.error(
                        { err, phone: student.parentPhone },
                        "Direct WhatsApp delay notification failed",
                      );
                    });
                  }
                }
              }

              logger.info(
                { tripId: String(trip._id), delayMinutes },
                "Delay detected and notification triggered",
              );
            }
          } catch (err) {
            logger.error(
              { err, tripId: String(trip._id) },
              "Error processing trip delay check",
            );
          }
        }
      } catch (err) {
        logger.error({ err }, "Delay detection job failed");
      } finally {
        if (client) {
          await client.close().catch(() => {});
        }
      }
    },
    { timezone: "Asia/Karachi" },
  );

  logger.info("Delay detection cron scheduled: every 5 min, 6 AM - 6 PM PKT");
}
