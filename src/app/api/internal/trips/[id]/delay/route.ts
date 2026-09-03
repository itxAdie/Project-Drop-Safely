import { NextRequest, NextResponse } from "next/server";
import { withInternalAuth } from "@/lib/middleware/internal-auth";
import { connectDB } from "@/lib/db/connection";
import { Trip } from "@/lib/db/models";
import { onTripDelayed } from "@/lib/services/notification-triggers";
import { AppError } from "@/lib/errors";

// POST /api/internal/trips/[id]/delay — called by WhatsApp service delay detector
export const POST = withInternalAuth(
  async (
    request: NextRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      const { id } = await context.params;
      const tripId = id as string;

      const body = await request.json();
      const delayMinutes = body.delayMinutes as number | undefined;

      if (typeof delayMinutes !== "number" || delayMinutes < 0) {
        return NextResponse.json(
          { success: false, error: "delayMinutes is required and must be a non-negative number" },
          { status: 400 },
        );
      }

      await connectDB();

      const trip = await Trip.findById(tripId);
      if (!trip) {
        return NextResponse.json(
          { success: false, error: "Trip not found" },
          { status: 404 },
        );
      }

      trip.delayMinutes = delayMinutes;
      await trip.save();

      // Fire-and-forget notification triggers
      await onTripDelayed(tripId, delayMinutes);

      return NextResponse.json({
        success: true,
        tripId,
        delayMinutes,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode },
        );
      }
      console.error("[internal/trips/delay] POST error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
