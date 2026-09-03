import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { routeLifecycleService } from "@/lib/services/route-lifecycle.service";
import { assignDriverSchema } from "@/lib/validators/route.validator";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

// POST — assign a driver to a route (admin only)
export const POST = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      const p = await context.params;
      const id = p.id as string;

      const body = await request.json();
      const parsed = assignDriverSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      await routeLifecycleService.assignDriverToRoute(
        id,
        parsed.data.driverId,
        parsed.data.vanIndex,
      );

      return NextResponse.json({
        success: true,
        message: "Driver assigned to route",
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode },
        );
      }
      console.error("[routes/[id]/assign-driver] POST error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  [UserRole.ADMIN],
);
