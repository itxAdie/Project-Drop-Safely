import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/auth";
import { driverService } from "@/lib/services/driver.service";
import { createDriverSchema } from "@/lib/validators/driver.validator";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

// POST — admin adds a driver directly (creates account + approves profile)
export const POST = withAuth(
  async (request) => {
    try {
      const body = await request.json();
      const parsed = createDriverSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          },
          { status: 400 },
        );
      }

      const driver = await driverService.createDriverByAdmin({
        ...parsed.data,
        licenseUrl: body.licenseUrl,
        licenseFrontUrl: body.licenseFrontUrl,
        licenseBackUrl: body.licenseBackUrl,
        cnicFrontUrl: body.cnicFrontUrl,
        cnicBackUrl: body.cnicBackUrl,
      });

      return NextResponse.json({ success: true, data: driver }, { status: 201 });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode },
        );
      }
      console.error("[admin/drivers] POST error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  [UserRole.ADMIN],
);