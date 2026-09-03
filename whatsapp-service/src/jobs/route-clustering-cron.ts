import cron from "node-cron";
import pino from "pino";
import { MongoClient } from "mongodb";

const logger = pino({ level: process.env.NODE_ENV === "development" ? "debug" : "info" });

const MONGODB_URI = process.env.MONGODB_URI || "";
const MAIN_APP_URL = process.env.MAIN_APP_URL || "http://localhost:3000";
const WHATSAPP_SERVICE_SECRET = process.env.WHATSAPP_SERVICE_SECRET || "";

/**
 * Route Clustering Cron
 *
 * Runs nightly at 2:00 AM PKT.
 *
 * Calls main app API endpoint POST /api/routes/candidates for each
 * active city, triggering re-clustering of unmatched students.
 */
export function startRouteClusteringCron(): void {
  // 0 2 * * * in Asia/Karachi timezone
  cron.schedule(
    "0 2 * * *",
    async () => {
      logger.info("Route clustering cron triggered");

      if (!MONGODB_URI) {
        logger.error("MONGODB_URI not configured — skipping route clustering");
        return;
      }

      let client: MongoClient | null = null;

      try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db();

        // Get all active cities
        const cities = await db
          .collection("cities")
          .find({ isActive: true })
          .toArray();

        if (cities.length === 0) {
          logger.info("No active cities found — skipping clustering");
          return;
        }

        logger.info(`Running clustering for ${cities.length} active cities`);

        let successCount = 0;
        let failCount = 0;

        for (const city of cities) {
          try {
            const response = await fetch(
              `${MAIN_APP_URL}/api/internal/clustering`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-api-secret": WHATSAPP_SERVICE_SECRET,
                },
                body: JSON.stringify({ city: city.name }),
                signal: AbortSignal.timeout(60000), // 60s timeout for clustering
              },
            );

            if (response.ok) {
              const result = await response.json() as { clustersGenerated?: number };
              logger.info(
                { city: city.name, clusters: result.clustersGenerated },
                "Clustering completed successfully",
              );
              successCount++;
            } else {
              const body = await response.text().catch(() => "");
              logger.warn(
                { city: city.name, status: response.status, body },
                "Clustering API returned error",
              );
              failCount++;
            }
          } catch (err) {
            logger.error(
              { err, city: city.name },
              "Clustering request failed",
            );
            failCount++;
          }
        }

        logger.info(
          { success: successCount, failed: failCount },
          "Route clustering cron complete",
        );
      } catch (err) {
        logger.error({ err }, "Route clustering cron failed");
      } finally {
        if (client) {
          await client.close().catch(() => {});
        }
      }
    },
    { timezone: "Asia/Karachi" },
  );

  logger.info("Route clustering cron scheduled: nightly at 2:00 AM PKT");
}
