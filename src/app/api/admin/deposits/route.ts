import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { connectDB } from "@/lib/db/connection";
import { Student } from "@/lib/db/models";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/enums";

// GET — admin deposit verification queue
export const GET = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      await connectDB();
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status") || "submitted";
      const page = parseInt(searchParams.get("page") || "1", 10);
      const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

      const filter: Record<string, unknown> = {};
      if (status !== "all") filter.depositStatus = status;

      const skip = (page - 1) * pageSize;
      const [data, totalItems] = await Promise.all([
        Student.find(filter)
          .select(
            "name phone city institute assignedRouteId depositStatus depositAmount depositReceiptUrl depositSubmittedAt depositVerifiedAt depositRefundedAt depositRejectionReason",
          )
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(pageSize)
          .lean()
          .exec(),
        Student.countDocuments(filter).exec(),
      ]);

      return NextResponse.json({
        success: true,
        data,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(totalItems / pageSize),
          totalItems,
        },
      });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to fetch deposits");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
  [UserRole.ADMIN],
);
