import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { connectDB } from "@/lib/db/connection";
import { Notification } from "@/lib/db/models";
import { AppError, NotFoundError, ForbiddenError } from "@/lib/errors";

// PATCH — mark notification as read
export const PATCH = withAuth(
  async (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    try {
      await connectDB();
      const { id } = await context.params as { id: string };

      const notification = await Notification.findById(id).lean().exec();
      if (!notification) {
        throw new NotFoundError("Notification");
      }

      // Verify ownership
      if (notification.recipientId.toString() !== request.user.id) {
        throw new ForbiddenError("You can only mark your own notifications as read");
      }

      await Notification.findByIdAndUpdate(id, { isRead: true }).exec();

      return NextResponse.json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to update notification");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
);
