import { Schema, model, models } from "mongoose";
import type { INotification } from "@/types";

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientPhone: String,
    channel: {
      type: String,
      enum: ["in_app", "whatsapp", "web_push", "sms"],
      required: true,
    },
    type: {
      type: String,
      enum: [
        "trip_started",
        "trip_completed",
        "trip_delayed",
        "pickup",
        "dropoff",
        "delay",
        "eta",
        "payment_reminder",
        "payment_verified",
        "payment_rejected",
        "route_assigned",
        "route_activated",
        "route_matched",
        "driver_approved",
        "otp",
        "system",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      expires: 30 * 24 * 60 * 60, // TTL 30 days
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ sentAt: 1 });

export const Notification =
  models.Notification || model<INotification>("Notification", notificationSchema);
