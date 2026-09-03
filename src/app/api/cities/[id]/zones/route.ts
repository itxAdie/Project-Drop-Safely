import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { connectDB } from "@/lib/db/connection";
import { Zone } from "@/lib/db/models";
import { AppError, NotFoundError } from "@/lib/errors";
import { UserRole } from "@/types/enums";
import type { IZone } from "@/types";

// GET — list zones for a city
export const GET = withAuth(
  async (_request: AuthenticatedRequest, { params }) => {
    try {
      await connectDB();
      const { id } = await params;
      const zones = await Zone.find({ cityId: id }).sort({ name: 1 }).lean().exec();
      return NextResponse.json({ success: true, data: zones });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to fetch zones");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.ADMIN],
);

// POST — create zone for a city
export const POST = withAuth(
  async (request: AuthenticatedRequest, { params }) => {
    try {
      await connectDB();
      const { id } = await params;
      const body = await request.json();
      const { name, acPrice, nonAcPrice, commissionPercent, platformFee } = body;

      if (!name || typeof acPrice !== "number" || typeof nonAcPrice !== "number") {
        return NextResponse.json(
          { success: false, error: "name, acPrice, and nonAcPrice are required" },
          { status: 400 },
        );
      }

      const zone = await Zone.create({
        cityId: id,
        name: name.trim(),
        acPrice,
        nonAcPrice,
        commissionPercent: commissionPercent ?? 15,
        platformFee: platformFee ?? 100,
      });

      return NextResponse.json({ success: true, data: zone.toObject() as IZone }, { status: 201 });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to create zone");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.ADMIN],
);

// PUT — update a zone (expects zoneId in body)
export const PUT = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      await connectDB();
      const body = await request.json();
      const { zoneId, ...updates } = body;

      if (!zoneId) {
        return NextResponse.json(
          { success: false, error: "zoneId is required" },
          { status: 400 },
        );
      }

      const allowed = ["name", "acPrice", "nonAcPrice", "commissionPercent", "platformFee"];
      const clean: Record<string, unknown> = {};
      for (const key of allowed) {
        if (updates[key] !== undefined) clean[key] = updates[key];
      }

      const zone = await Zone.findByIdAndUpdate(zoneId, clean, { new: true }).lean().exec();
      if (!zone) throw new NotFoundError("Zone");

      return NextResponse.json({ success: true, data: zone });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to update zone");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.ADMIN],
);

// DELETE — delete a zone (expects zoneId in body or query)
export const DELETE = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      await connectDB();
      const { searchParams } = new URL(request.url);
      const zoneId = searchParams.get("zoneId");

      if (!zoneId) {
        return NextResponse.json(
          { success: false, error: "zoneId query param is required" },
          { status: 400 },
        );
      }

      const zone = await Zone.findByIdAndDelete(zoneId).lean().exec();
      if (!zone) throw new NotFoundError("Zone");

      return NextResponse.json({ success: true, message: "Zone deleted" });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to delete zone");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.ADMIN],
);
