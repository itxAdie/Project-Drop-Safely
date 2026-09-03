import { Schema, model, models } from "mongoose";
import type { ICity } from "@/types";

const citySchema = new Schema<ICity>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

citySchema.index({ name: 1 });

export const City = models.City || model<ICity>("City", citySchema);
