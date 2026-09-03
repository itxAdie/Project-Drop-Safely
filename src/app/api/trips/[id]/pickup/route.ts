import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { driverService } from "@/lib/services/driver.service";
import { AppError, ForbiddenError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

// POST — mark student as picked up
export const POST = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> }
  ) => {
    try {
      const p = await context.params;
      const tripId = p.id as string;

      // Get the driver associated with the requesting user
      const driver = await driverService.getDriverByUserId(request.user.id);
      if (!driver && request.user.role !== UserRole.ADMIN) {
        throw new ForbiddenError("Driver profile not found");
      }

      const body = await request.json();
      const { studentId } = body;

      if (!studentId) {
        return NextResponse.json(
          { success: false, error: "studentId is required" },
          { status: 400 }
        );
      }

      const driverId = driver ? String(driver._id) : "";
      const trip = await driverService.markPickup(tripId, studentId, driverId);

      return NextResponse.json({
        success: true,
        data: trip,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode }
        );
      }
      console.error("[trips/[id]/pickup] POST error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
