import { z } from "zod";

export const createStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .regex(/^(\+92|0)?[0-9]{10,11}$/, "Invalid Pakistani phone number"),
  parentPhone: z
    .string()
    .regex(/^(\+92|0)?[0-9]{10,11}$/, "Invalid phone number")
    .optional(),
  pickupAddress: z.string().min(5, "Address must be at least 5 characters"),
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  institute: z.string().min(2, "Institute name is required"),
  city: z.string().min(2, "City is required"),
  classStartTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  classEndTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  permanentOffDays: z
    .array(z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]))
    .optional(),
});

export const updateStudentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  parentPhone: z.string().regex(/^(\+92|0)?[0-9]{10,11}$/).optional(),
  pickupAddress: z.string().min(5).optional(),
  pickupLat: z.number().min(-90).max(90).optional(),
  pickupLng: z.number().min(-180).max(180).optional(),
  institute: z.string().min(2).optional(),
  classStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  classEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  permanentOffDays: z
    .array(z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]))
    .optional(),
});

export const createDayOffSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  reason: z.string().max(200).optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type CreateDayOffInput = z.infer<typeof createDayOffSchema>;
