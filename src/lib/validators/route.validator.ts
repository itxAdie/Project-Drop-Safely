import { z } from "zod";

export const activateRouteSchema = z.object({
  candidateId: z.string().min(1, "Candidate ID is required"),
  name: z.string().min(3, "Route name must be at least 3 characters"),
  driverId: z.string().optional(),
});

export const assignDriverSchema = z.object({
  driverId: z.string().min(1, "Driver ID is required"),
  vanIndex: z.number().int().min(0).optional(),
});

export const generateCandidatesSchema = z.object({
  city: z.string().min(1, "City is required"),
});

export const routeListQuerySchema = z.object({
  city: z.string().optional(),
  status: z.enum(["candidate", "active", "inactive", "archived"]).optional(),
  page: z.string().optional().default("1"),
  pageSize: z.string().optional().default("20"),
});

export const candidateListQuerySchema = z.object({
  city: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export const updateRouteSchema = z.object({
  name: z.string().min(3).optional(),
  radiusKm: z.number().positive().optional(),
  minStudents: z.number().int().positive().optional(),
  status: z.enum(["candidate", "active", "inactive", "archived"]).optional(),
});

export type ActivateRouteInput = z.infer<typeof activateRouteSchema>;
export type AssignDriverInput = z.infer<typeof assignDriverSchema>;
export type GenerateCandidatesInput = z.infer<typeof generateCandidatesSchema>;
export type RouteListQueryInput = z.infer<typeof routeListQuerySchema>;
export type CandidateListQueryInput = z.infer<typeof candidateListQuerySchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
