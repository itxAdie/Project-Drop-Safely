import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { driverService } from "@/lib/services/driver.service";
import { AppError } from "@/lib/errors";

// GET — trip details
export const GET = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> }
  ) => {
    try {
      const p = await context.params;
      const id = p.id as string;
      const trip = await driverService.getTripDetails(id);

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
      console.error("[trips/[id]] GET error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
