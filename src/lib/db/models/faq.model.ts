import { Schema, model, models } from "mongoose";
import type { IFaq } from "@/types";

const faqSchema = new Schema<IFaq>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
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

faqSchema.index({ order: 1 });

export const Faq = models.Faq || model<IFaq>("Faq", faqSchema);
