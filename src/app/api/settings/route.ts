import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { connectDB } from "@/lib/db/connection";
import { Settings, City } from "@/lib/db/models";
import { AppError, NotFoundError } from "@/lib/errors";
import { UserRole } from "@/types/enums";
import type { ISettings } from "@/types";

// GET — get settings (optionally by city)
export const GET = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      await connectDB();
      const { searchParams } = new URL(request.url);
      const cityId = searchParams.get("cityId");

      if (cityId) {
        const settings = await Settings.findOne({ cityId }).lean().exec();
        if (!settings) {
          return NextResponse.json({ success: true, data: null });
        }
        return NextResponse.json({ success: true, data: settings });
      }

      // Return all settings
      const allSettings = await Settings.find().populate("cityId", "name").lean().exec();
      return NextResponse.json({ success: true, data: allSettings });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to fetch settings");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.ADMIN],
);

// PUT — update settings for a city
export const PUT = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      await connectDB();
      const body = await request.json();
      const { cityId, ...updates } = body;

      if (!cityId) {
        return NextResponse.json(
          { success: false, error: "cityId is required" },
          { status: 400 },
        );
      }

      // Verify city exists
      const city = await City.findById(cityId).lean().exec();
      if (!city) throw new NotFoundError("City");

      const allowed = [
        "clusterRadiusKm",
        "minStudentsPerRoute",
        "maxTimeSlots",
        "defaultCommissionPercent",
        "defaultPlatformFee",
        "paymentReminderDaysBefore",
      ];

      const clean: Record<string, unknown> = {};
      for (const key of allowed) {
        if (updates[key] !== undefined) clean[key] = updates[key];
      }

      const settings = await Settings.findOneAndUpdate(
        { cityId },
        { $set: clean },
        { new: true, upsert: true },
      ).lean().exec();

      return NextResponse.json({ success: true, data: settings });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to update settings");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.ADMIN],
);
