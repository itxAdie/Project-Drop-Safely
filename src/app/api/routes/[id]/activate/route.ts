import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { routeLifecycleService } from "@/lib/services/route-lifecycle.service";
import { activateRouteSchema } from "@/lib/validators/route.validator";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

// POST — activate a route from a candidate (admin only)
export const POST = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      const p = await context.params;
      const id = p.id as string;

      const body = await request.json();
      const parsed = activateRouteSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      // The route ID in the URL is used as the candidateId reference
      // The body may override candidateId, otherwise use URL param
      const candidateId = parsed.data.candidateId || id;

      const route = await routeLifecycleService.activateRoute(
        candidateId,
        parsed.data.name,
        parsed.data.driverId,
      );

      return NextResponse.json(
        { success: true, data: route },
        { status: 201 },
      );
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode },
        );
      }
      console.error("[routes/[id]/activate] POST error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  [UserRole.ADMIN],
);
