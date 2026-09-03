import { Schema, model, models } from "mongoose";
import type { IDriver } from "@/types";

const driverSchema = new Schema<IDriver>(
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
    cnic: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ["van", "mini_bus", "bus", "car"],
      required: true,
    },
    vehicleCapacity: {
      type: Number,
      required: true,
    },
    vehicleRegNumber: {
      type: String,
      required: true,
    },
    licenseUrl: {
      type: String,
    },
    policeVerificationUrl: {
      type: String,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    assignedRouteIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Route",
      },
    ],
    city: {
      type: String,
      required: true,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
      _id: false,
    },
    lastLocationUpdate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

driverSchema.index({ userId: 1 });
driverSchema.index({ city: 1, isApproved: 1 });
driverSchema.index({ cnic: 1 });
driverSchema.index({ currentLocation: "2dsphere" });

export const Driver = models.Driver || model<IDriver>("Driver", driverSchema);
