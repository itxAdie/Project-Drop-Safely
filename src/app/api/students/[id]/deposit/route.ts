import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { StudentService } from "@/lib/services/student.service";
import { uploadReceiptSchema } from "@/lib/validators/payment.validator";
import { AppError, ForbiddenError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

const studentService = new StudentService();

// POST — submit refundable deposit receipt for current student
export const POST = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      const { id } = (await context.params) as { id: string };

      if (request.user.role === UserRole.STUDENT) {
        const student = await studentService.getStudentByUserId(request.user.id);
        if (!student || student._id.toString() !== id) {
          throw new ForbiddenError("You can only update your own deposit");
        }
      }

      const body = await request.json();
      const validated = uploadReceiptSchema.parse(body);

      const student = await studentService.submitDeposit(id, validated.receiptUrl);
      return NextResponse.json(
        {
          success: true,
          data: {
            status: student.depositStatus,
            amount: student.depositAmount,
            receiptUrl: student.depositReceiptUrl,
          },
          message: "Deposit receipt submitted for review",
        },
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
