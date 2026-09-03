import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/auth";
import { connectDB } from "@/lib/db/connection";
import { Student } from "@/lib/db/models";
import { UserRole } from "@/types/enums";

/**
 * GET /api/analytics/heatmap
 *
 * Aggregates student pickup locations where status indicates they
 * are still waiting / unmatched, grouped by ~500m geo-grid precision.
 *
 * Query params:
 *   - city: optional filter by city name
 *
 * Returns: [{ lat, lng, intensity }]
 */
export const GET = withAuth(
  async (request: NextRequest) => {
    await connectDB();

    const url = new URL(request.url);
    const city = url.searchParams.get("city");

    // Build query: students who are "pending" (waiting for route assignment)
    const query: Record<string, unknown> = {
      status: "pending",
    };
    if (city) {
      query.city = city;
    }

    const students = await Student.find(query)
      .select("pickupLocation")
      .lean()
      .exec();

    // Group by geo-grid (~500m precision ≈ 0.0045 degrees)
    const GRID_PRECISION = 3; // decimal places ≈ ~111m * 10^(-precision+3) ≈ ~111m at 3dp... actually
    // 3 decimal places ≈ ~111m resolution; use 2 for ~1.1km or 3 for ~111m
    // For ~500m, we round to ~0.005 degree steps
    const STEP = 0.005;

    const grid = new Map<string, { lat: number; lng: number; count: number }>();

    for (const student of students) {
      const loc = (student as { pickupLocation?: { coordinates?: [number, number] } })
        .pickupLocation;
      if (!loc?.coordinates || loc.coordinates.length < 2) continue;

      const [lng, lat] = loc.coordinates;
      const gridLat = Math.round(lat / STEP) * STEP;
      const gridLng = Math.round(lng / STEP) * STEP;
      const key = `${gridLat.toFixed(GRID_PRECISION)},${gridLng.toFixed(GRID_PRECISION)}`;

      const existing = grid.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        grid.set(key, { lat: gridLat, lng: gridLng, count: 1 });
      }
    }

    // Convert to heatmap points with normalized intensity (0–1)
    const maxCount = Math.max(...Array.from(grid.values()).map((v) => v.count), 1);
    const heatmap = Array.from(grid.values()).map((cell) => ({
      lat: cell.lat,
      lng: cell.lng,
      intensity: cell.count / maxCount,
    }));

    return NextResponse.json({ data: heatmap });
  },
  [UserRole.ADMIN],
);
