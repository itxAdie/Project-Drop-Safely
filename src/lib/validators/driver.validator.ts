import { z } from "zod";

export const cnicSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ""))
  .refine((digits) => /^[0-9]{13}$/.test(digits), {
    message: "Invalid CNIC format (XXXXX-XXXXXXX-X)",
  })
  .transform((digits) => `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`);

export const createDriverSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .regex(/^(\+92|0)?[0-9]{10,11}$/, "Invalid Pakistani phone number"),
  cnic: cnicSchema,
  vehicleType: z.enum(["ac_van", "non_ac_van", "mini_bus"]),
  vehicleCapacity: z.number().int().min(1).max(80),
  vehicleRegNumber: z.string().min(3, "Registration number is required"),
  city: z.string().min(2, "City is required"),
  licenseUrl: z.string().url().optional(),
  licenseFrontUrl: z.string().url().optional(),
  licenseBackUrl: z.string().url().optional(),
  cnicFrontUrl: z.string().url().optional(),
  cnicBackUrl: z.string().url().optional(),
});

export const updateDriverSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  vehicleType: z.enum(["ac_van", "non_ac_van", "mini_bus"]).optional(),
  vehicleCapacity: z.number().int().min(1).max(80).optional(),
  vehicleRegNumber: z.string().min(3).optional(),
  licenseUrl: z.string().url().optional(),
  licenseFrontUrl: z.string().url().optional(),
  licenseBackUrl: z.string().url().optional(),
  cnicFrontUrl: z.string().url().optional(),
  cnicBackUrl: z.string().url().optional(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
