import { Schema, model, models } from "mongoose";
import type { IRouteCandidate } from "@/types";

const routeCandidateSchema = new Schema<IRouteCandidate>(
  {
    city: {
      type: String,
      required: true,
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
    studentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    suggestedSequence: [
      {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: [Number],
      },
    ],
    matchCount: {
      type: Number,
      default: 0,
    },
    timeSlot: {
      type: String,
      enum: ["morning", "afternoon", "evening"],
      required: true,
    },
    departureTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

routeCandidateSchema.index({ city: 1, status: 1 });
routeCandidateSchema.index({ centroid: "2dsphere" });

export const RouteCandidate =
  models.RouteCandidate || model<IRouteCandidate>("RouteCandidate", routeCandidateSchema);
