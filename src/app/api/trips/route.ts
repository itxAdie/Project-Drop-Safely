import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { driverService } from "@/lib/services/driver.service";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";
import { z } from "zod";

const createTripSchema = z.object({
  routeId: z.string().min(1),
  driverId: z.string().min(1),
  timeSlot: z.enum(["morning", "afternoon", "evening"]),
  direction: z.enum(["pickup", "dropoff"]),
  studentIds: z.array(z.string().min(1)).min(1),
});

// POST — create a daily trip (admin only)
export const POST = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const parsed = createTripSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const trip = await driverService.createDailyTrips(parsed.data);

      return NextResponse.json(
        { success: true, data: trip },
        { status: 201 }
      );
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode }
        );
      }
      console.error("[trips] POST error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  },
  [UserRole.ADMIN]
);
