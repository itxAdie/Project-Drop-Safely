import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { driverService } from "@/lib/services/driver.service";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

// GET — get driver profile by userId query param (driver or admin only)
export const GET = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get("userId") || request.user.id;

      // Ownership check: non-admin users can only view their own profile
      if (
        request.user.role !== UserRole.ADMIN &&
        userId !== request.user.id
      ) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 },
        );
      }

      const driver = await driverService.getDriverByUserId(userId);

      if (!driver) {
        return NextResponse.json({
          success: true,
          driver: null,
          routes: [],
        });
      }

      const profile = await driverService.getProfile(String(driver._id));

      return NextResponse.json({
        success: true,
        ...profile,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode },
        );
      }
      console.error("[drivers/profile] GET error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  [UserRole.DRIVER, UserRole.ADMIN],
);
