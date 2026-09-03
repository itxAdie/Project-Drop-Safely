import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { PaymentService } from "@/lib/services/payment.service";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

const paymentService = new PaymentService();

// POST — verify or reject a payment receipt
export const POST = withAuth(
  async (request: AuthenticatedRequest, { params }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { approved, rejectionReason } = body;

      if (typeof approved !== "boolean") {
        return NextResponse.json(
          { success: false, error: "approved must be a boolean" },
          { status: 400 },
        );
      }

      await paymentService.verifyPayment(id as string, request.user.id, approved, rejectionReason);

      return NextResponse.json({
        success: true,
        message: approved ? "Payment verified" : "Payment rejected",
      });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to verify payment");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.ADMIN],
);
