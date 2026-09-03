import { Router, Request, Response, NextFunction } from "express";
import pino from "pino";
import { WhatsAppService } from "./services/whatsapp.js";
import { OtpHandler } from "./handlers/otp.handler.js";
import { NotificationHandler } from "./handlers/notification.handler.js";

const logger = pino({ level: process.env.NODE_ENV === "development" ? "debug" : "info" });

export function createRouter(whatsapp: WhatsAppService): Router {
  const router = Router();
  const otpHandler = new OtpHandler(whatsapp);
  const notificationHandler = new NotificationHandler(whatsapp);

  const apiSecret = process.env.WHATSAPP_SERVICE_SECRET;

  // Health check — no auth required (used by Docker healthcheck)
  router.get("/health", (_req: Request, res: Response) => {
    res.json({
      success: true,
      status: "ok",
      whatsapp: whatsapp.getStatus(),
      connected: whatsapp.isConnected(),
      timestamp: new Date().toISOString(),
    });
  });

  // QR status — no auth required (returns the current pairing QR for scanning)
  router.get("/qr", (_req: Request, res: Response) => {
    res.json({
      success: true,
      status: whatsapp.getStatus(),
      connected: whatsapp.isConnected(),
      qr: whatsapp.isConnected() ? null : whatsapp.getQr(),
      timestamp: new Date().toISOString(),
    });
  });

  // Auth middleware — all routes below require x-api-secret header
  router.use((req: Request, res: Response, next: NextFunction) => {
    const provided = req.headers["x-api-secret"];

    if (!apiSecret) {
      logger.error("WHATSAPP_SERVICE_SECRET is not configured");
      res.status(500).json({ success: false, error: "Service misconfigured" });
      return;
    }

    if (provided !== apiSecret) {
      logger.warn({ ip: req.ip }, "Unauthorized API request");
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    next();
  });

  // OTP endpoint
  router.post("/send-otp", (req: Request, res: Response) => {
    otpHandler.sendOtp(req, res);
  });

  // Notification endpoint
  router.post("/send-notification", (req: Request, res: Response) => {
    notificationHandler.sendNotification(req, res);
  });

  return router;
}
