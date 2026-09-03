import { WASocket } from "@whiskeysockets/baileys";
import pino from "pino";
import { SessionManager } from "./session-manager.js";

const logger = pino({ level: process.env.NODE_ENV === "development" ? "debug" : "info" });

export class WhatsAppService {
  private sessionManager: SessionManager;

  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
  }

  isConnected(): boolean {
    return this.sessionManager.isConnected();
  }

  getStatus() {
    return this.sessionManager.getStatus();
  }

  getQr(): string | null {
    return this.sessionManager.getQr();
  }

  /**
   * Send a text message to a phone number.
   * Pakistani numbers: accepts 03XXXXXXXXX, converts to 923XXXXXXXXX@s.whatsapp.net
   * Retries up to 3 times with exponential backoff.
   */
  async sendMessage(phone: string, text: string): Promise<{ success: boolean; messageId?: string }> {
    const formatted = this.formatPhoneNumber(phone);

    if (!this.isConnected()) {
      logger.warn("Attempted to send message while not connected");
      return { success: false };
    }

    const sock = this.sessionManager.getSocket();
    if (!sock) {
      logger.error("Socket is null despite connected status");
      return { success: false };
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await sock.sendMessage(formatted, { text });
        logger.info(
          { to: formatted, messageId: result?.key?.id },
          "Message sent successfully"
        );
        return { success: true, messageId: result?.key?.id ?? undefined };
      } catch (err) {
        lastError = err as Error;
        logger.warn(
          { err, attempt, to: formatted },
          `Message send attempt ${attempt} failed`
        );

        if (attempt < 3) {
          const delay = 1000 * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    logger.error({ err: lastError, to: formatted }, "All 3 send attempts failed");
    return { success: false };
  }

  /**
   * Convert Pakistani phone number format to WhatsApp JID.
   * Accepts: 03XXXXXXXXX, +923XXXXXXXXX, 923XXXXXXXXX
   * Returns: 923XXXXXXXXX@s.whatsapp.net
   */
  formatPhoneNumber(phone: string): string {
    // Remove all whitespace and dashes
    let cleaned = phone.replace(/[\s\-()]/g, "");

    // Handle +92 prefix
    if (cleaned.startsWith("+92")) {
      cleaned = cleaned.slice(1); // Remove +
    }

    // Handle 03XX format (local Pakistani)
    if (cleaned.startsWith("0")) {
      cleaned = "92" + cleaned.slice(1);
    }

    // Validate: should start with 923 and be 12 digits
    if (!/^923\d{9}$/.test(cleaned)) {
      logger.warn({ phone, cleaned }, "Phone number may not be a valid Pakistani mobile number");
    }

    return `${cleaned}@s.whatsapp.net`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
