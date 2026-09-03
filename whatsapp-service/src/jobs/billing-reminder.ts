import cron from "node-cron";
import pino from "pino";
import { MongoClient } from "mongodb";

const logger = pino({ level: process.env.NODE_ENV === "development" ? "debug" : "info" });

const MONGODB_URI = process.env.MONGODB_URI || "";
const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || "http://localhost:3001";
const WHATSAPP_SERVICE_SECRET = process.env.WHATSAPP_SERVICE_SECRET || "";

/**
 * Haversine distance in km between two lat/lng points.
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Billing Reminder Job
 *
 * Runs daily at 10:00 AM PKT (5:00 AM UTC)
 *
 * Queries MongoDB for students with billing cycle ending in 2 days,
 * sends WhatsApp payment reminders to parents.
 */
export function startBillingReminder(): void {
  // 0 10 * * * = 10:00 AM in Asia/Karachi timezone
  cron.schedule(
    "0 10 * * *",
    async () => {
      logger.info("Billing reminder job triggered");

      if (!MONGODB_URI) {
        logger.error("MONGODB_URI not configured — skipping billing reminder");
        return;
      }

      let client: MongoClient | null = null;
      let reminderCount = 0;

      try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db();

        // Find payments due in 2 days
        const now = new Date();
        const targetDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
        const dayAfter = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

        const payments = await db
          .collection("payments")
          .find({
            billingPeriodEnd: { $gte: targetDate, $lt: dayAfter },
            status: { $in: ["pending", "submitted"] },
          })
          .toArray();

        logger.info(`Found ${payments.length} payments due in 2 days`);

        for (const payment of payments) {
          try {
            // Get student to find parent phone
            const student = await db
              .collection("students")
              .findOne({ _id: payment.studentId });

            if (!student?.parentPhone) {
              logger.debug(`No parent phone for student ${String(payment.studentId)}`);
              continue;
            }

            const days = Math.ceil(
              (new Date(payment.billingPeriodEnd).getTime() - now.getTime()) /
                (24 * 60 * 60 * 1000),
            );

            // Send WhatsApp reminder
            const response = await fetch(
              `${WHATSAPP_SERVICE_URL}/api/send-notification`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-api-secret": WHATSAPP_SERVICE_SECRET,
                },
                body: JSON.stringify({
                  phone: student.parentPhone,
                  type: "payment_reminder",
                  data: {
                    studentName: student.name,
                    days,
                    amount: payment.amount,
                    dueDate: new Date(payment.billingPeriodEnd).toLocaleDateString(
                      "en-PK",
                    ),
                  },
                }),
                signal: AbortSignal.timeout(5000),
              },
            );

            if (response.ok) {
              reminderCount++;
              // Update reminders sent count
              await db
                .collection("payments")
                .updateOne(
                  { _id: payment._id },
                  { $inc: { remindersSent: 1 } },
                );
            } else {
              logger.warn(
                `WhatsApp reminder failed for ${student.parentPhone}: ${response.status}`,
              );
            }
          } catch (err) {
            logger.error(
              { err, paymentId: String(payment._id) },
              "Failed to send billing reminder",
            );
          }
        }

        logger.info(`Billing reminder complete: ${reminderCount} reminders sent`);
      } catch (err) {
        logger.error({ err }, "Billing reminder job failed");
      } finally {
        if (client) {
          await client.close().catch(() => {});
        }
      }
    },
    { timezone: "Asia/Karachi" },
  );

  logger.info("Billing reminder cron scheduled: daily at 10:00 AM PKT");
}

// Export haversine for use in delay-detector
export { haversineDistance };
