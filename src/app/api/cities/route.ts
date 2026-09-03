import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { connectDB } from "@/lib/db/connection";
import { City, Zone } from "@/lib/db/models";
import { AppError, ConflictError } from "@/lib/errors";
import { UserRole } from "@/types/enums";
import type { ICity, IZone } from "@/types";

// GET — list all cities
export const GET = withAuth(
  async () => {
    try {
      await connectDB();
      const cities = await City.find().sort({ name: 1 }).lean().exec();

      // For each city, fetch zones
      const citiesWithZones = await Promise.all(
        cities.map(async (city) => {
          const zones = await Zone.find({ cityId: city._id }).sort({ name: 1 }).lean().exec();
          return { ...city, zones };
        }),
      );

      return NextResponse.json({ success: true, data: citiesWithZones });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to fetch cities");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.ADMIN],
);

// POST — create a new city
export const POST = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      await connectDB();
      const body = await request.json();
      const { name } = body;

      if (!name || typeof name !== "string" || name.trim().length < 2) {
        return NextResponse.json(
          { success: false, error: "City name must be at least 2 characters" },
          { status: 400 },
        );
      }

      const existing = await City.findOne({ name: new RegExp(`^${name.trim()}$`, "i") }).lean().exec();
      if (existing) throw new ConflictError("City already exists");

      const city = await City.create({ name: name.trim(), isActive: true });
      return NextResponse.json({ success: true, data: city.toObject() as ICity }, { status: 201 });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to create city");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.ADMIN],
);
