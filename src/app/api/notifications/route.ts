import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { connectDB } from "@/lib/db/connection";
import { Notification } from "@/lib/db/models";
import { AppError } from "@/lib/errors";

// GET — list notifications for current user (paginated)
export const GET = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      await connectDB();
      const { searchParams } = new URL(request.url);
      const page = Number(searchParams.get("page") || "1");
      const pageSize = Math.min(Number(searchParams.get("pageSize") || "20"), 50);
      const skip = (page - 1) * pageSize;
      const unreadOnly = searchParams.get("unreadOnly") === "true";

      const filter: Record<string, unknown> = { recipientId: request.user.id };
      if (unreadOnly) {
        filter.isRead = false;
      }

      const [notifications, totalItems] = await Promise.all([
        Notification.find(filter)
          .sort({ sentAt: -1 })
          .skip(skip)
          .limit(pageSize)
          .lean()
          .exec(),
        Notification.countDocuments(filter).exec(),
      ]);

      return NextResponse.json({
        success: true,
        data: notifications,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(totalItems / pageSize),
          totalItems,
        },
      });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to fetch notifications");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
);
