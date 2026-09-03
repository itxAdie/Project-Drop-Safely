import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { StudentService } from "@/lib/services/student.service";
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

// GET — co-passengers (names only)
export const GET = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      const { id } = await context.params as { id: string };
      await verifyOwnership(request.user.id, id, request.user.role);

      const coPassengers = await studentService.getCoPassengers(id);
      return NextResponse.json({ success: true, data: coPassengers });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to fetch co-passengers");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.STUDENT, UserRole.ADMIN],
);
