import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { driverService } from "@/lib/services/driver.service";
import { AppError, ForbiddenError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

// GET — today's trips for a driver
export const GET = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> }
  ) => {
    try {
      const p = await context.params;
      const id = p.id as string;

      const driver = await driverService.getDriverByUserId(request.user.id);
      if (request.user.role !== UserRole.ADMIN && (!driver || String(driver._id) !== id)) {
        throw new ForbiddenError("You can only access your own trips");
      }

      const trips = await driverService.getTodayTrips(id);

      return NextResponse.json({
        success: true,
        data: trips,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode }
        );
      }
      console.error("[drivers/[id]/trips] GET error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
