import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import pino from "pino";

import { SessionManager } from "./services/session-manager.js";
import { WhatsAppService } from "./services/whatsapp.js";
import { createRouter } from "./api.js";
import { startBillingReminder } from "./jobs/billing-reminder.js";
import { startRouteClusteringCron } from "./jobs/route-clustering-cron.js";
import { startDelayDetector } from "./jobs/delay-detector.js";

const logger = pino({ level: process.env.NODE_ENV === "development" ? "debug" : "info" });

const PORT = parseInt(process.env.PORT || "3001", 10);

async function main(): Promise<void> {
  logger.info("Starting Drop Safely WhatsApp Service...");

  // Initialize WhatsApp session manager and service
  const sessionManager = new SessionManager("./auth_info");
  const whatsapp = new WhatsAppService(sessionManager);

  // Start WhatsApp connection (non-blocking — service starts even if not connected)
  sessionManager.start().catch((err) => {
    logger.error({ err }, "Failed to start WhatsApp session — service running in degraded mode");
  });

  // Initialize Express server
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Health check at root level (used by Docker healthcheck)
  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      status: "ok",
      connected: whatsapp.isConnected(),
      timestamp: new Date().toISOString(),
    });
  });

  // API routes — mounted at /api so endpoints are /api/send-otp, /api/send-notification, etc.
  app.use("/api", createRouter(whatsapp));

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: "Not found" });
  });

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, "Unhandled error");
    res.status(500).json({ success: false, error: "Internal server error" });
  });

  // Start HTTP server
  app.listen(PORT, () => {
    logger.info({ port: PORT }, `WhatsApp service listening on port ${PORT}`);
  });

  // Start background job schedulers
  startBillingReminder();
  startRouteClusteringCron();
  startDelayDetector();

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info({ signal }, "Shutdown signal received — cleaning up");
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception");
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    logger.fatal({ reason }, "Unhandled rejection");
    process.exit(1);
  });
}

main().catch((err) => {
  logger.fatal({ err }, "Fatal error during startup");
  process.exit(1);
});
