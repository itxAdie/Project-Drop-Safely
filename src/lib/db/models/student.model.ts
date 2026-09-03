import { Schema, model, models } from "mongoose";
import type { IStudent } from "@/types";

const studentSchema = new Schema<IStudent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    parentPhone: {
      type: String,
      trim: true,
    },
    pickupLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    pickupAddress: {
      type: String,
      required: true,
    },
    institute: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    classStartTime: {
      type: String,
      required: true,
    },
    classEndTime: {
      type: String,
      required: true,
    },
    permanentOffDays: {
      type: [String],
      default: [],
    },
    suddenOffDays: {
      type: [String],
      default: [],
    },
    assignedRouteId: {
      type: Schema.Types.ObjectId,
      ref: "Route",
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive", "suspended"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "submitted", "verified", "rejected", "overdue"],
      default: "pending",
    },
    billingCycleStart: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

studentSchema.index({ userId: 1 });
studentSchema.index({ city: 1, status: 1 });
studentSchema.index({ institute: 1 });
studentSchema.index({ assignedRouteId: 1 });
studentSchema.index({ pickupLocation: "2dsphere" });

export const Student = models.Student || model<IStudent>("Student", studentSchema);
