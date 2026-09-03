import { Schema, model, models } from "mongoose";
import type { IGpsLocation } from "@/types";

const gpsLocationSchema = new Schema<IGpsLocation>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: "Route",
    },
    location: {
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
    speed: Number,
    timestamp: {
      type: Date,
      default: Date.now,
      expires: 24 * 60 * 60, // TTL 24 hours
    },
  },
  {
    timestamps: true,
  },
);

gpsLocationSchema.index({ driverId: 1, timestamp: -1 });
gpsLocationSchema.index({ location: "2dsphere" });

export const GpsLocation =
  models.GpsLocation || model<IGpsLocation>("GpsLocation", gpsLocationSchema);
