import { Otp } from "@/lib/db/models";
import { connectDB } from "@/lib/db/connection";
import { AppError } from "@/lib/errors";
import {
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_LENGTH,
} from "@/lib/constants";
import type { IOtpService } from "./interfaces";
import { normalizePhone } from "@/lib/utils/phone";

const OTP_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const OTP_RATE_LIMIT_MAX = 3;

function generateOtpCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString().padStart(OTP_LENGTH, "0");
}

class OtpService implements IOtpService {
  async sendOtp(phone: string, purpose: string = "login"): Promise<void> {
    await connectDB();
    const normalized = normalizePhone(phone);

    // ── Rate limiting: max 3 OTPs per phone per hour ─────────────────────
    const oneHourAgo = new Date(Date.now() - OTP_RATE_LIMIT_WINDOW_MS);
    const recentCount = await Otp.countDocuments({
      phone: normalized,
      createdAt: { $gte: oneHourAgo },
    });

    if (recentCount >= OTP_RATE_LIMIT_MAX) {
      throw new AppError(
        "Too many OTP requests. Please try again later.",
        429,
      );
    }

    // ── Invalidate previous unused OTPs for this phone ───────────────────
    await Otp.updateMany(
      { phone: normalized, isUsed: false },
      { $set: { isUsed: true } },
    );

    // ── Generate and persist new OTP ─────────────────────────────────────
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.create({ phone: normalized, code, purpose, expiresAt });

    // ── Deliver via WhatsApp (or dev fallback) ───────────────────────────
    const whatsappUrl = process.env.WHATSAPP_SERVICE_URL;
    const whatsappSecret = process.env.WHATSAPP_SERVICE_SECRET;

    if (whatsappUrl && whatsappUrl.length > 0) {
      try {
        const res = await fetch(`${whatsappUrl}/api/send-otp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-secret": whatsappSecret ?? "",
          },
          body: JSON.stringify({ phone: normalized, code }),
        });

        if (!res.ok) {
          console.error(
            `[OtpService] WhatsApp delivery failed: ${res.status} ${res.statusText}`,
          );
          throw new AppError("Failed to send OTP via WhatsApp. Try again.", 502);
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
        console.error("[OtpService] WhatsApp service unreachable:", err);
        throw new AppError(
          "WhatsApp service is unavailable. Please try again shortly.",
          503,
        );
      }
    } else {
      // Dev fallback — only log OTP in development/test environments
      if (
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test"
      ) {
        console.log(
          `\n🔑 [DEV OTP] Phone: ${normalized} | Code: ${code} | Expires: ${OTP_EXPIRY_MINUTES}min\n`,
        );
      } else {
        console.error("WhatsApp service not configured in production");
      }
    }
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    await connectDB();
    const normalized = normalizePhone(phone);
    const now = new Date();

    // Find the most recent unused OTP for this phone
    let otp = await Otp.findOne({
      phone: normalized,
      isUsed: false,
    }).sort({ createdAt: -1 });

    // ── Idempotency guard ──────────────────────────────────────────────
    // A client may inadvertently submit the same (correct) OTP twice
    // (e.g. auto-submit + button click). The first call consumes the OTP,
    // so the second call would otherwise fail with "No active OTP found".
    // If the most recent OTP for this phone is already used but its code
    // matches, treat it as a successful repeat verification.
    if (!otp && code && code.length > 0) {
      const lastUsed = await Otp.findOne({
        phone: normalized,
        isUsed: true,
      }).sort({ createdAt: -1 });
      if (lastUsed && lastUsed.code === code) {
        return true;
      }
      otp = null;
    }

    if (!otp) {
      throw new AppError("No active OTP found. Please request a new one.", 400);
    }

    // ── Expiry check ─────────────────────────────────────────────────────
    if (otp.expiresAt < now) {
      otp.isUsed = true;
      await otp.save();
      throw new AppError("OTP has expired. Please request a new one.", 400);
    }

    // ── Max attempts check ───────────────────────────────────────────────
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      otp.isUsed = true;
      await otp.save();
      throw new AppError(
        "Maximum verification attempts exceeded. Please request a new OTP.",
        400,
      );
    }

    // ── Code comparison ──────────────────────────────────────────────────
    otp.attempts += 1;

    if (otp.code !== code) {
      await otp.save();
      const remaining = OTP_MAX_ATTEMPTS - otp.attempts;
      throw new AppError(
        `Invalid OTP code. ${Math.max(0, remaining)} attempt(s) remaining.`,
        400,
      );
    }

    // ── Success ──────────────────────────────────────────────────────────
    otp.isUsed = true;
    await otp.save();
    return true;
  }
}

export const otpService = new OtpService();
