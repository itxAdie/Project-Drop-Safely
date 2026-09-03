import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { connectDB } from "@/lib/db/connection";
import { City } from "@/lib/db/models";
import { AppError, NotFoundError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

// PATCH — toggle city active status
export const PATCH = withAuth(
  async (request: AuthenticatedRequest, { params }) => {
    try {
      await connectDB();
      const { id } = await params;
      const body = await request.json();
      const { isActive } = body;

      if (typeof isActive !== "boolean") {
        return NextResponse.json(
          { success: false, error: "isActive must be a boolean" },
          { status: 400 },
        );
      }

      const city = await City.findByIdAndUpdate(id, { isActive }, { new: true }).lean().exec();
      if (!city) throw new NotFoundError("City");

      return NextResponse.json({ success: true, data: city });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to update city");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.ADMIN],
);
