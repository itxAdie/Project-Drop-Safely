import { Schema, model, models } from "mongoose";
import type { IRoute } from "@/types";

const vanAssignmentSchema = new Schema(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
    },
    studentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    capacity: {
      type: Number,
      required: true,
    },
    pickupSequence: [
      {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: [Number],
      },
    ],
  },
  { _id: false },
);

const routeSchema = new Schema<IRoute>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
    },
    zoneId: {
      type: Schema.Types.ObjectId,
      ref: "Zone",
    },
    institutes: [String],
    centroid: {
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
    radiusKm: {
      type: Number,
      default: 3,
    },
    timeSlots: [
      {
        type: String,
        enum: ["morning", "afternoon", "evening"],
      },
    ],
    vans: [vanAssignmentSchema],
    totalStudents: {
      type: Number,
      default: 0,
    },
    minStudents: {
      type: Number,
      default: 7,
    },
    status: {
      type: String,
      enum: ["candidate", "active", "inactive", "archived"],
      default: "candidate",
    },
  },
  {
    timestamps: true,
  },
);

routeSchema.index({ city: 1, status: 1 });
routeSchema.index({ centroid: "2dsphere" });
routeSchema.index({ institutes: 1 });

export const Route = models.Route || model<IRoute>("Route", routeSchema);
