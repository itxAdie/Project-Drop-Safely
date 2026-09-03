import { z } from "zod";

export const uploadReceiptSchema = z.object({
  receiptUrl: z.string().url("Must be a valid URL"),
});

export const verifyPaymentSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().max(500).optional(),
});

export type UploadReceiptInput = z.infer<typeof uploadReceiptSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
