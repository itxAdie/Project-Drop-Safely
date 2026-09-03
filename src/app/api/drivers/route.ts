import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { driverService } from "@/lib/services/driver.service";
import { createDriverSchema } from "@/lib/validators/driver.validator";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

// GET — list drivers (admin only)
export const GET = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get("page") || "1", 10);
      const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);

      const result = await driverService.listDrivers(page, pageSize);

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode }
        );
      }
      console.error("[drivers] GET error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  },
  [UserRole.ADMIN]
);

// POST — register a new driver (self-registration)
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const parsed = createDriverSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const driver = await driverService.register({
      ...parsed.data,
      userId: request.user.id,
      licenseUrl: body.licenseUrl,
      policeVerificationUrl: body.policeVerificationUrl,
    });

    return NextResponse.json(
      { success: true, data: driver },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.statusCode }
      );
    }
    console.error("[drivers] POST error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
