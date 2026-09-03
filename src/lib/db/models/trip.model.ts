import { Schema, model, models } from "mongoose";
import type { ITrip } from "@/types";

const tripStudentSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "picked_up", "dropped_off", "absent"],
      default: "pending",
    },
    pickedUpAt: Date,
    droppedOffAt: Date,
  },
  { _id: false },
);

const gpsPointSchema = new Schema(
  {
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: [Number],
    },
    timestamp: Date,
  },
  { _id: false },
);

const tripSchema = new Schema<ITrip>(
  {
    routeId: {
      type: Schema.Types.ObjectId,
      ref: "Route",
      required: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      enum: ["morning", "afternoon", "evening"],
      required: true,
    },
    direction: {
      type: String,
      enum: ["pickup", "dropoff"],
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
    },
    students: [tripStudentSchema],
    gpsTrail: [gpsPointSchema],
    startedAt: Date,
    completedAt: Date,
    delayMinutes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

tripSchema.index({ routeId: 1, date: 1 });
tripSchema.index({ driverId: 1, date: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ date: 1 });

export const Trip = models.Trip || model<ITrip>("Trip", tripSchema);
