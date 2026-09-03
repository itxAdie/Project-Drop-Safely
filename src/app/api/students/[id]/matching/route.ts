import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { StudentService } from "@/lib/services/student.service";
import { routeEngineService } from "@/lib/services/route-engine.service";
import { AppError, ForbiddenError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

const studentService = new StudentService();

// GET — student matching progress
export const GET = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      const p = await context.params;
      const id = p.id as string;

      // Student can only view own matching progress (admin can view any)
      if (request.user.role !== UserRole.ADMIN) {
        const student = await studentService.getStudentByUserId(request.user.id);
        if (!student || student._id.toString() !== id) {
          throw new ForbiddenError("You can only view your own matching progress");
        }
      }

      const progress = await routeEngineService.getMatchingProgress(id);

      return NextResponse.json({
        success: true,
        data: progress,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode },
        );
      }
      console.error("[students/[id]/matching] GET error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  [UserRole.STUDENT, UserRole.ADMIN],
);
