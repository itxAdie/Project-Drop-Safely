import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { StudentService } from "@/lib/services/student.service";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";
import { z } from "zod";

const studentService = new StudentService();

const depositActionSchema = z.object({
  action: z.enum(["verify", "reject", "refund"]),
  rejectionReason: z.string().max(500).optional(),
});

// POST — admin verifies, rejects, or refunds a student's deposit
export const POST = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      const { id } = (await context.params) as { id: string };
      const body = await request.json();
      const validated = depositActionSchema.parse(body);

      const student = await studentService.adminUpdateDeposit(
        id,
        validated.action,
        validated.rejectionReason,
      );

      return NextResponse.json({
        success: true,
        data: {
          status: student.depositStatus,
          amount: student.depositAmount,
        },
        message: `Deposit ${validated.action} successfully`,
      });
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
  [UserRole.ADMIN],
);
