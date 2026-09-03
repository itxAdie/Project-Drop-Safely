import { NextRequest, NextResponse } from "next/server";
import { withInternalAuth } from "@/lib/middleware/internal-auth";
import { routeEngineService } from "@/lib/services/route-engine.service";
import { connectDB } from "@/lib/db/connection";
import { RouteCandidate } from "@/lib/db/models";
import { AppError } from "@/lib/errors";

// POST /api/internal/clustering — triggered by WhatsApp service cron
export const POST = withInternalAuth(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const city = body.city as string | undefined;

      if (!city || typeof city !== "string") {
        return NextResponse.json(
          { success: false, error: "city is required" },
          { status: 400 },
        );
      }

      // Count existing candidates before generation
      await connectDB();
      const beforeCount = await RouteCandidate.countDocuments({ city });

      await routeEngineService.generateCandidates(city);

      // Count after generation
      const afterCount = await RouteCandidate.countDocuments({ city });
      const clustersGenerated = afterCount - beforeCount;

      return NextResponse.json({
        success: true,
        clustersGenerated,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode },
        );
      }
      console.error("[internal/clustering] POST error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
