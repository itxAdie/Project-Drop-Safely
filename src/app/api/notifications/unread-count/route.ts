import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { connectDB } from "@/lib/db/connection";
import { Notification } from "@/lib/db/models";
import { AppError } from "@/lib/errors";

// GET — return unread notification count
export const GET = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      await connectDB();
      const count = await Notification.countDocuments({
        recipientId: request.user.id,
        isRead: false,
      }).exec();

      return NextResponse.json({ count });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to get unread count");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
);
