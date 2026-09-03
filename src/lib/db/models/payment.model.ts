import { Schema, model, models } from "mongoose";
import type { IPayment } from "@/types";

const paymentSchema = new Schema<IPayment>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: "Route",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    platformFee: {
      type: Number,
      required: true,
    },
    billingPeriodStart: {
      type: Date,
      required: true,
    },
    billingPeriodEnd: {
      type: Date,
      required: true,
    },
    receiptUrl: String,
    status: {
      type: String,
      enum: ["pending", "submitted", "verified", "rejected", "overdue"],
      default: "pending",
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: Date,
    rejectionReason: String,
    remindersSent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ studentId: 1, status: 1 });
paymentSchema.index({ routeId: 1 });
paymentSchema.index({ status: 1 });

export const Payment = models.Payment || model<IPayment>("Payment", paymentSchema);
