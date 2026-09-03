import { z } from "zod";

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .regex(/^(\+92|0)?[0-9]{10,11}$/, "Invalid Pakistani phone number format"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10, "Phone number is required"),
  code: z.string().length(6, "OTP must be 6 digits"),
});

export const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
