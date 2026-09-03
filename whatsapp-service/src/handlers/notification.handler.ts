import { Request, Response } from "express";
import pino from "pino";
import { WhatsAppService } from "../services/whatsapp.js";
import { pickupTemplate } from "../templates/pickup.js";
import { dropoffTemplate } from "../templates/dropoff.js";
import { delayTemplate } from "../templates/delay.js";
import { etaTemplate } from "../templates/eta.js";
import { paymentReminderTemplate } from "../templates/payment-reminder.js";
import { routeActivatedTemplate } from "../templates/route-activated.js";

const logger = pino({ level: process.env.NODE_ENV === "development" ? "debug" : "info" });

const VALID_TYPES = ["pickup", "dropoff", "delay", "eta", "payment_reminder", "route_activated"] as const;
type NotificationType = (typeof VALID_TYPES)[number];

export class NotificationHandler {
  private whatsapp: WhatsAppService;

  constructor(whatsapp: WhatsAppService) {
    this.whatsapp = whatsapp;
  }

  /**
   * POST /send-notification
   * Body: { phone: string, type: string, data: object }
   */
  async sendNotification(req: Request, res: Response): Promise<void> {
    const { phone, type, data } = req.body as {
      phone?: string;
      type?: string;
      data?: Record<string, unknown>;
    };

    // Validate inputs
    if (!phone || typeof phone !== "string") {
      res.status(400).json({ success: false, error: "Phone number is required" });
      return;
    }

    if (!type || typeof type !== "string") {
      res.status(400).json({ success: false, error: "Notification type is required" });
      return;
    }

    if (!data || typeof data !== "object") {
      res.status(400).json({ success: false, error: "Data object is required" });
      return;
    }

    if (!VALID_TYPES.includes(type as NotificationType)) {
      res.status(400).json({
        success: false,
        error: `Invalid notification type. Must be one of: ${VALID_TYPES.join(", ")}`,
      });
      return;
    }

    // Validate phone format
    const cleaned = phone.replace(/[\s\-()+]/g, "");
    if (!/^(923\d{9}|03\d{9})$/.test(cleaned)) {
      res.status(400).json({
        success: false,
        error: "Invalid phone number format. Expected Pakistani mobile: 03XXXXXXXXX",
      });
      return;
    }

    // Check WhatsApp connection
    if (!this.whatsapp.isConnected()) {
      logger.warn("Notification send attempted while WhatsApp is not connected");
      res.status(503).json({
        success: false,
        error: "WhatsApp service is not connected. Please try again later.",
      });
      return;
    }

    // Build message from template
    let message: string;
    try {
      message = this.buildMessage(type as NotificationType, data);
    } catch (err) {
      logger.error({ err, type, data }, "Failed to build notification message");
      res.status(400).json({
        success: false,
        error: `Invalid data for notification type '${type}': ${(err as Error).message}`,
      });
      return;
    }

    // Send message
    const result = await this.whatsapp.sendMessage(phone, message);

    if (result.success) {
      logger.info({ phone, type }, "Notification sent successfully");
      res.json({ success: true, messageId: result.messageId });
    } else {
      logger.error({ phone, type }, "Failed to send notification");
      res.status(500).json({ success: false, error: "Failed to send notification" });
    }
  }

  private buildMessage(type: NotificationType, data: Record<string, unknown>): string {
    switch (type) {
      case "pickup":
        return pickupTemplate({
          studentName: String(data.studentName),
          time: String(data.time),
          routeName: String(data.routeName),
        });

      case "dropoff":
        return dropoffTemplate({
          studentName: String(data.studentName),
          institute: String(data.institute),
          time: String(data.time),
        });

      case "delay":
        return delayTemplate({
          routeName: String(data.routeName),
          minutes: Number(data.minutes),
          reason: String(data.reason),
          newEta: String(data.newEta),
        });

      case "eta":
        return etaTemplate({
          studentName: String(data.studentName),
          minutes: Number(data.minutes),
        });

      case "payment_reminder":
        return paymentReminderTemplate({
          studentName: String(data.studentName),
          days: Number(data.days),
          amount: Number(data.amount),
          dueDate: String(data.dueDate),
        });

      case "route_activated":
        return routeActivatedTemplate({
          routeName: String(data.routeName),
          driverName: String(data.driverName),
          pickupTime: String(data.pickupTime),
          studentName: String(data.studentName),
        });

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }
}
