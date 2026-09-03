import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { connectDB } from "@/lib/db/connection";
import { RouteCandidate } from "@/lib/db/models";
import { routeEngineService } from "@/lib/services/route-engine.service";
import {
  generateCandidatesSchema,
  candidateListQuerySchema,
} from "@/lib/validators/route.validator";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

// GET — list route candidates (admin only)
export const GET = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      await connectDB();

      const url = new URL(request.url);
      const rawQuery = {
        city: url.searchParams.get("city") || undefined,
        status: url.searchParams.get("status") || undefined,
      };

      const parsed = candidateListQuerySchema.safeParse(rawQuery);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      const filter: Record<string, unknown> = {};
      if (parsed.data.city) filter.city = parsed.data.city;
      if (parsed.data.status) filter.status = parsed.data.status;

      const candidates = await RouteCandidate.find(filter)
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      return NextResponse.json({
        success: true,
        data: candidates,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode },
        );
      }
      console.error("[routes/candidates] GET error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  [UserRole.ADMIN],
);

// POST — trigger clustering for a city (admin only)
export const POST = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const parsed = generateCandidatesSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      await connectDB();
      const beforeCount = await RouteCandidate.countDocuments({ city: parsed.data.city });

      await routeEngineService.generateCandidates(parsed.data.city);

      const afterCount = await RouteCandidate.countDocuments({ city: parsed.data.city });
      const clustersGenerated = afterCount - beforeCount;

      return NextResponse.json({
        success: true,
        message: `Clustering completed for ${parsed.data.city}`,
        clustersGenerated,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode },
        );
      }
      console.error("[routes/candidates] POST error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  [UserRole.ADMIN],
);
