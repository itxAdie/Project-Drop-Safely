import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { driverService } from "@/lib/services/driver.service";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

// POST — reject a driver (admin only)
export const POST = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      const { id } = await context.params;
      const body = await request.json().catch(() => ({ reason: undefined }));
      await driverService.rejectDriver(id as string, body.reason || "Rejected by admin");
      return NextResponse.json({
        success: true,
        message: "Driver rejected",
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode },
        );
      }
      console.error("[drivers/[id]/reject] POST error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  [UserRole.ADMIN],
);