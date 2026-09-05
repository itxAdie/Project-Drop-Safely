import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { connectDB } from "@/lib/db/connection";
import { RouteRepository } from "@/lib/repositories/route.repository";
import { Student } from "@/lib/db/models";
import { AppError, NotFoundError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

const routeRepo = new RouteRepository();

const ROSTER_SELECT =
  "name phone parentPhone pickupAddress institute paymentStatus status vanIndex";

// GET — students on a route, grouped by van (admin only)
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

      const seats: Array<{ studentId: string; vanIndex: number }> = [];
      route.vans.forEach((van, idx) => {
        for (const studentId of van.studentIds) {
          seats.push({ studentId: studentId.toString(), vanIndex: idx });
        }
      });

      const students = await Student.find({
        _id: { $in: seats.map((s) => s.studentId) },
      })
        .select(ROSTER_SELECT)
        .lean()
        .exec();

      const studentsById = new Map(students.map((s) => [s._id.toString(), s]));
      const roster = seats
        .filter((seat, i) => {
          const first = seats.findIndex((x) => x.studentId === seat.studentId);
          return first === i;
        })
        .map((seat) => {
          const s = studentsById.get(seat.studentId);
          if (!s) return null;
          return {
            _id: s._id as unknown as string,
            name: s.name,
            phone: s.phone,
            parentPhone: s.parentPhone ?? null,
            pickupAddress: s.pickupAddress,
            institute: s.institute,
            paymentStatus: s.paymentStatus,
            status: s.status,
            vanIndex: seat.vanIndex,
          };
        })
        .filter(Boolean);

      return NextResponse.json({ success: true, data: roster });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode },
        );
      }
      console.error("[routes/[id]/students] GET error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  [UserRole.ADMIN],
);