import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { kpiService } from "@/lib/services/kpi.service";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

export const GET = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const city = searchParams.get("city") || undefined;
      const detailed = searchParams.get("detailed") === "true";

      if (detailed) {
        const data = await kpiService.getDetailedDashboard(city);
        return NextResponse.json({ success: true, data });
      }

      const data = await kpiService.getDashboardKpi(city);
      return NextResponse.json({ success: true, data });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to fetch KPIs");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.ADMIN],
);
