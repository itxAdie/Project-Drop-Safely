import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { PaymentService } from "@/lib/services/payment.service";
import { StudentService } from "@/lib/services/student.service";
import { uploadReceiptSchema } from "@/lib/validators/payment.validator";
import { AppError, ForbiddenError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

const paymentService = new PaymentService();
const studentService = new StudentService();

async function verifyOwnership(userId: string, studentId: string, role: UserRole) {
  if (role === UserRole.ADMIN) return;
  const student = await studentService.getStudentByUserId(userId);
  if (!student || student._id.toString() !== studentId) {
    throw new ForbiddenError("You can only access your own data");
  }
}

// GET — payment history
export const GET = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      const { id } = await context.params as { id: string };
      await verifyOwnership(request.user.id, id, request.user.role);

      const [history, currentStatus] = await Promise.all([
        paymentService.getPaymentHistory(id),
        paymentService.getCurrentPaymentStatus(id),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          history,
          current: currentStatus,
        },
      });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to fetch payments");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.STUDENT, UserRole.ADMIN],
);

// POST — upload receipt
export const POST = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      const { id } = await context.params as { id: string };
      await verifyOwnership(request.user.id, id, request.user.role);

      const body = await request.json();
      const validated = uploadReceiptSchema.parse(body);

      const payment = await paymentService.uploadReceiptForStudent(id, validated.receiptUrl);
      return NextResponse.json(
        { success: true, data: payment, message: "Receipt uploaded successfully" },
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
