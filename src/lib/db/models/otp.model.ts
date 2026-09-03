import { Schema, model, models } from "mongoose";
import type { IOtp } from "@/types";

const otpSchema = new Schema<IOtp>(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0, // TTL index — document auto-deletes at expiresAt
    },
  },
  {
    timestamps: true,
  },
);

otpSchema.index({ phone: 1, code: 1 });

export const Otp = models.Otp || model<IOtp>("Otp", otpSchema);
