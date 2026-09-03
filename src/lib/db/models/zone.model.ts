import { Schema, model, models } from "mongoose";
import type { IZone } from "@/types";

const zoneSchema = new Schema<IZone>(
  {
    cityId: {
      type: Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    acPrice: {
      type: Number,
      required: true,
    },
    nonAcPrice: {
      type: Number,
      required: true,
    },
    commissionPercent: {
      type: Number,
      default: 15,
    },
    platformFee: {
      type: Number,
      default: 100,
    },
  },
  {
    timestamps: true,
  },
);

zoneSchema.index({ cityId: 1 });

export const Zone = models.Zone || model<IZone>("Zone", zoneSchema);
