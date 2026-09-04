import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { driverService } from "@/lib/services/driver.service";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

// POST — approve a driver (admin only)
export const POST = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      const { id } = await context.params;
      await driverService.approveDriver(id as string);
      return NextResponse.json({
        success: true,
        message: "Driver approved",
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode },
        );
      }
      console.error("[drivers/[id]/approve] POST error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  [UserRole.ADMIN],
);