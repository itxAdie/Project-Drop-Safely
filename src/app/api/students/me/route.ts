import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { StudentService } from "@/lib/services/student.service";
import { PaymentService } from "@/lib/services/payment.service";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

const studentService = new StudentService();
const paymentService = new PaymentService();

// GET — get current student's profile + matching progress + payment status
export const GET = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      const student = await studentService.getStudentByUserId(request.user.id);
      if (!student) {
        return NextResponse.json(
          { success: true, data: null, message: "No student profile found" },
        );
      }

      const studentId = student._id.toString();

      // Fetch additional data in parallel
      const [profile, matchingProgress, paymentStatus] = await Promise.all([
        studentService.getProfile(studentId),
        studentService.getMatchingProgress(studentId),
        paymentService.getCurrentPaymentStatus(studentId),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          ...profile,
          matchingProgress,
          paymentStatus,
        },
      });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to fetch profile");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.STUDENT],
);
