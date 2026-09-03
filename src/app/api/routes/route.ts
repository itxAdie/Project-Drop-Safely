import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { RouteRepository } from "@/lib/repositories/route.repository";
import { connectDB } from "@/lib/db/connection";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";
import { routeListQuerySchema } from "@/lib/validators/route.validator";

const routeRepo = new RouteRepository();

// GET — list routes (admin only), filterable by city and status
export const GET = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      await connectDB();

      const url = new URL(request.url);
      const rawQuery = {
        city: url.searchParams.get("city") || undefined,
        status: url.searchParams.get("status") || undefined,
        page: url.searchParams.get("page") || "1",
        pageSize: url.searchParams.get("pageSize") || "20",
      };

      const parsed = routeListQuerySchema.safeParse(rawQuery);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      const { city, status, page, pageSize } = parsed.data;
      const filter: Record<string, unknown> = {};
      if (city) filter.city = city;
      if (status) filter.status = status;

      const result = await routeRepo.findMany({
        filter,
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode },
        );
      }
      console.error("[routes] GET error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  [UserRole.ADMIN],
);
