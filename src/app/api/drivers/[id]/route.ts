import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { driverService } from "@/lib/services/driver.service";
import { updateDriverSchema } from "@/lib/validators/driver.validator";
import { AppError, ForbiddenError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

// GET — driver profile (own or admin)
export const GET = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> }
  ) => {
    try {
      const p = await context.params;
      const id = p.id as string;

      // Driver can only access own profile
      const driver = await driverService.getDriverByUserId(request.user.id);
      if (request.user.role !== UserRole.ADMIN && (!driver || String(driver._id) !== id)) {
        throw new ForbiddenError("You can only access your own profile");
      }

      const profile = await driverService.getProfile(id);

      return NextResponse.json({
        success: true,
        ...profile,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode }
        );
      }
      console.error("[drivers/[id]] GET error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

// PATCH — update driver profile
export const PATCH = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> }
  ) => {
    try {
      const p = await context.params;
      const id = p.id as string;

      const driver = await driverService.getDriverByUserId(request.user.id);
      if (request.user.role !== UserRole.ADMIN && (!driver || String(driver._id) !== id)) {
        throw new ForbiddenError("You can only update your own profile");
      }

      const body = await request.json();
      const parsed = updateDriverSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const updated = await driverService.updateProfile(id, parsed.data);

      return NextResponse.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode }
        );
      }
      console.error("[drivers/[id]] PATCH error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
