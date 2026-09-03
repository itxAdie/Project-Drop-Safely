import { Request, Response } from "express";
import pino from "pino";
import { WhatsAppService } from "../services/whatsapp.js";
import { otpTemplate } from "../templates/otp.js";

const logger = pino({ level: process.env.NODE_ENV === "development" ? "debug" : "info" });

export class OtpHandler {
  private whatsapp: WhatsAppService;

  constructor(whatsapp: WhatsAppService) {
    this.whatsapp = whatsapp;
  }

  /**
   * POST /send-otp
   * Body: { phone: string, code: string }
   */
  async sendOtp(req: Request, res: Response): Promise<void> {
    const { phone, code } = req.body as { phone?: string; code?: string };

    // Validate inputs
    if (!phone || typeof phone !== "string") {
      res.status(400).json({ success: false, error: "Phone number is required" });
      return;
    }

    if (!code || typeof code !== "string") {
      res.status(400).json({ success: false, error: "OTP code is required" });
      return;
    }

    // Validate phone format (Pakistani mobile)
    const cleaned = phone.replace(/[\s\-()+]/g, "");
    const isValid =
      /^(923\d{9}|03\d{9})$/.test(cleaned);

    if (!isValid) {
      res.status(400).json({
        success: false,
        error: "Invalid phone number format. Expected Pakistani mobile: 03XXXXXXXXX",
      });
      return;
    }

    // Check WhatsApp connection
    if (!this.whatsapp.isConnected()) {
      logger.warn("OTP send attempted while WhatsApp is not connected");
      res.status(503).json({
        success: false,
        error: "WhatsApp service is not connected. Please try again later.",
      });
      return;
    }

    // Build and send message
    const message = otpTemplate({ code });
    const result = await this.whatsapp.sendMessage(phone, message);

    if (result.success) {
      logger.info({ phone }, "OTP sent successfully");
      res.json({ success: true, messageId: result.messageId });
    } else {
      logger.error({ phone }, "Failed to send OTP");
      res.status(500).json({ success: false, error: "Failed to send OTP" });
    }
  }
}
