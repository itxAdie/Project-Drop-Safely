import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { connectDB } from "@/lib/db/connection";
import { Notification } from "@/lib/db/models";
import { AppError } from "@/lib/errors";

// PATCH — mark all notifications as read for current user
export const PATCH = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      await connectDB();
      const result = await Notification.updateMany(
        { recipientId: request.user.id, isRead: false },
        { isRead: true },
      ).exec();

      return NextResponse.json({
        success: true,
        message: `${result.modifiedCount} notifications marked as read`,
      });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to mark all as read");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
);
