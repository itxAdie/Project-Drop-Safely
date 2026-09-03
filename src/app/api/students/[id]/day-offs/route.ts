import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { StudentService } from "@/lib/services/student.service";
import { createDayOffSchema } from "@/lib/validators/student.validator";
import { AppError, ForbiddenError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

const studentService = new StudentService();

async function verifyOwnership(userId: string, studentId: string, role: UserRole) {
  if (role === UserRole.ADMIN) return;
  const student = await studentService.getStudentByUserId(userId);
  if (!student || student._id.toString() !== studentId) {
    throw new ForbiddenError("You can only access your own data");
  }
}

// GET — list day offs
export const GET = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      const { id } = await context.params as { id: string };
      await verifyOwnership(request.user.id, id, request.user.role);

      const dayOffs = await studentService.getDayOffs(id);
      return NextResponse.json({ success: true, data: dayOffs });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to fetch day offs");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.STUDENT, UserRole.ADMIN],
);

// POST — add sudden day off
export const POST = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      const { id } = await context.params as { id: string };
      await verifyOwnership(request.user.id, id, request.user.role);

      const body = await request.json();
      const validated = createDayOffSchema.parse(body);

      await studentService.markDayOff(id, validated.date);
      return NextResponse.json(
        { success: true, message: "Day off added successfully" },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.statusCode },
        );
      }
      if (error && typeof error === "object" && "issues" in error) {
        const zodError = error as { issues: Array<{ path: string[]; message: string }> };
        return NextResponse.json(
          { success: false, error: "Validation failed", details: zodError.issues },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  [UserRole.STUDENT, UserRole.ADMIN],
);

// DELETE — remove sudden day off (date in query param)
export const DELETE = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      const { id } = await context.params as { id: string };
      await verifyOwnership(request.user.id, id, request.user.role);

      const { searchParams } = new URL(request.url);
      const date = searchParams.get("date");
      if (!date) {
        return NextResponse.json(
          { success: false, error: "Date query parameter is required" },
          { status: 400 },
        );
      }

      await studentService.removeDayOff(id, date);
      return NextResponse.json({ success: true, message: "Day off removed" });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to remove day off");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.STUDENT, UserRole.ADMIN],
);
