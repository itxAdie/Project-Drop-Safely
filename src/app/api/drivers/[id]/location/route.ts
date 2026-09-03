import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { driverService } from "@/lib/services/driver.service";
import { AppError, ForbiddenError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

// POST — update GPS location
export const POST = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> }
  ) => {
    try {
      const p = await context.params;
      const id = p.id as string;

      const driver = await driverService.getDriverByUserId(request.user.id);
      if (request.user.role !== UserRole.ADMIN && (!driver || String(driver._id) !== id)) {
        throw new ForbiddenError("You can only update your own location");
      }

      const body = await request.json();
      const { latitude, longitude, speed } = body;

      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return NextResponse.json(
          { success: false, error: "latitude and longitude are required" },
          { status: 400 }
        );
      }

      await driverService.updateLocation(id, longitude, latitude, speed);

      return NextResponse.json({
        success: true,
        message: "Location updated",
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode }
        );
      }
      console.error("[drivers/[id]/location] POST error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
