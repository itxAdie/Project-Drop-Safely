import { Schema, model, models } from "mongoose";
import type { ISettings } from "@/types";

const settingsSchema = new Schema<ISettings>(
  {
    cityId: {
      type: Schema.Types.ObjectId,
      ref: "City",
      required: true,
      unique: true,
    },
    clusterRadiusKm: {
      type: Number,
      default: 3,
    },
    minStudentsPerRoute: {
      type: Number,
      default: 7,
    },
    maxTimeSlots: {
      type: Number,
      default: 3,
    },
    defaultCommissionPercent: {
      type: Number,
      default: 15,
    },
    defaultPlatformFee: {
      type: Number,
      default: 100,
    },
    paymentReminderDaysBefore: {
      type: Number,
      default: 3,
    },
  },
  {
    timestamps: true,
  },
);

settingsSchema.index({ cityId: 1 });

export const Settings = models.Settings || model<ISettings>("Settings", settingsSchema);
