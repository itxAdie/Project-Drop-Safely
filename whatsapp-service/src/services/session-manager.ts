import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  ConnectionState,
  fetchLatestBaileysVersion,
  Browsers,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCodeTerminal from "qrcode-terminal";
import path from "path";

const logger = pino({ level: process.env.NODE_ENV === "development" ? "debug" : "info" });

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "waiting-qr";

export class SessionManager {
  private sock: WASocket | null = null;
  private status: ConnectionStatus = "disconnected";
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30_000;
  private authDir: string;
  private lastQr: string | null = null;

  constructor(authDir: string = "./auth_info") {
    this.authDir = path.resolve(authDir);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getQr(): string | null {
    return this.lastQr;
  }

  getSocket(): WASocket | null {
    return this.sock;
  }

  async start(): Promise<WASocket> {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      const { version } = await fetchLatestBaileysVersion();

      this.sock = makeWASocket({
        version,
        auth: state,
        logger: logger.child({ module: "baileys" }) as unknown as pino.Logger,
        browser: Browsers.ubuntu("Drop Safely"),
        printQRInTerminal: false, // We handle QR manually for better control
      });

      this.sock.ev.on("creds.update", saveCreds);

      this.sock.ev.on("connection.update", (update: Partial<ConnectionState>) => {
        this.handleConnectionUpdate(update);
      });

      return this.sock;
    } catch (err) {
      logger.error({ err }, "Failed to initialize WhatsApp session");
      this.status = "disconnected";
      throw err;
    }
  }

  private handleConnectionUpdate(update: Partial<ConnectionState>): void {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      this.lastQr = qr;
      this.status = "waiting-qr";
      logger.info("QR code received — scan to authenticate");
      QRCodeTerminal.generate(qr, { small: true });
    }

    if (connection === "open") {
      this.lastQr = null;
      this.status = "connected";
      this.reconnectAttempts = 0;
      logger.info("WhatsApp connection established");
    }

    if (connection === "close") {
      this.lastQr = null;
      this.status = "disconnected";
      const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)
        ?.output?.statusCode;

      // statusCode === DisconnectReason.loggedOut means session is invalid
      if (statusCode === DisconnectReason.loggedOut) {
        logger.error("Logged out — session invalidated. Need to re-scan QR.");
        this.restart();
        return;
      }

      // For all other disconnect reasons, attempt reconnect with backoff
      const delay = Math.min(
        1000 * Math.pow(2, this.reconnectAttempts),
        this.maxReconnectDelay
      );
      this.reconnectAttempts++;

      logger.warn(
        { statusCode, attempt: this.reconnectAttempts, delay },
        "WhatsApp connection closed — reconnecting"
      );

      setTimeout(() => {
        this.restart();
      }, delay);
    }
  }

  private async restart(): Promise<void> {
    try {
      this.status = "connecting";
      await this.start();
    } catch (err) {
      logger.error({ err }, "Reconnection failed — retrying in 10s");
      setTimeout(() => this.restart(), 10_000);
    }
  }

  isConnected(): boolean {
    return this.status === "connected";
  }
}
