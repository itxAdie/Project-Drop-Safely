import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { StudentService } from "@/lib/services/student.service";
import { updateStudentSchema } from "@/lib/validators/student.validator";
import { AppError, ForbiddenError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

const studentService = new StudentService();

async function getStudentAndVerify(
  userId: string,
  studentId: string,
  role: UserRole,
) {
  // Admin can access any student
  if (role === UserRole.ADMIN) return;

  // Student can only access own profile
  const student = await studentService.getStudentByUserId(userId);
  if (!student || student._id.toString() !== studentId) {
    throw new ForbiddenError("You can only access your own profile");
  }
}

// GET — student profile
export const GET = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      const { id } = await context.params as { id: string };
      await getStudentAndVerify(request.user.id, id, request.user.role);

      const student = await studentService.getProfile(id);
      return NextResponse.json({ success: true, data: student });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to fetch profile");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.STUDENT, UserRole.ADMIN],
);

// PATCH — update student profile
export const PATCH = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      const { id } = await context.params as { id: string };
      await getStudentAndVerify(request.user.id, id, request.user.role);

      const body = await request.json();
      const validated = updateStudentSchema.parse(body);

      // Handle coordinate updates
      const updateData: Record<string, unknown> = { ...validated };
      if (validated.pickupLat !== undefined && validated.pickupLng !== undefined) {
        updateData.pickupLocation = {
          type: "Point",
          coordinates: [validated.pickupLng, validated.pickupLat],
        };
        delete updateData.pickupLat;
        delete updateData.pickupLng;
      }

      const student = await studentService.updateStudent(id, updateData as never);
      return NextResponse.json({ success: true, data: student });
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
