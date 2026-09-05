import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { connectDB } from "@/lib/db/connection";
import { RouteRepository } from "@/lib/repositories/route.repository";
import { routeLifecycleService } from "@/lib/services/route-lifecycle.service";
import { updateRouteSchema } from "@/lib/validators/route.validator";
import { AppError, NotFoundError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

const routeRepo = new RouteRepository();

// GET — route detail (admin only)
export const GET = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      await connectDB();

      const p = await context.params;
      const id = p.id as string;

      const route = await routeRepo.findById(id, "vans.driverId");
      if (!route) {
        throw new NotFoundError("Route");
      }

      return NextResponse.json({
        success: true,
        data: route,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode },
        );
      }
      console.error("[routes/[id]] GET error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  [UserRole.ADMIN],
);

// PATCH — update route (admin only)
export const PATCH = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      await connectDB();

      const p = await context.params;
      const id = p.id as string;

      const body = await request.json();
      const parsed = updateRouteSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      // Handle status transitions via lifecycle service
      if (parsed.data.status === "inactive") {
        await routeLifecycleService.deactivateRoute(id);
      } else if (parsed.data.status === "archived") {
        await routeLifecycleService.archiveRoute(id);
      }

      // Update other fields directly
      const { status: _status, ...otherFields } = parsed.data;
      if (Object.keys(otherFields).length > 0) {
        const updated = await routeRepo.update(id, otherFields as Record<string, unknown>);
        if (!updated) throw new NotFoundError("Route");
        return NextResponse.json({ success: true, data: updated });
      }

      const route = await routeRepo.findById(id);
      return NextResponse.json({ success: true, data: route });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode },
        );
      }
      console.error("[routes/[id]] PATCH error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  [UserRole.ADMIN],
);
