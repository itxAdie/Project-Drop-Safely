import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { subscribeWebPush } from "@/lib/services/web-push.service";
import { AppError } from "@/lib/errors";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

// POST — save web push subscription for authenticated user
export const POST = withAuth(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const parsed = subscriptionSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid subscription data",
            details: parsed.error.flatten().fieldErrors,
          },
          { status: 400 },
        );
      }

      await subscribeWebPush(request.user.id, {
        endpoint: parsed.data.endpoint,
        keys: {
          p256dh: parsed.data.keys.p256dh,
          auth: parsed.data.keys.auth,
        },
        createdAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: "Push subscription saved",
      });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError("Failed to save subscription");
      return NextResponse.json(
        { success: false, error: appError.message },
        { status: appError.statusCode },
      );
    }
  },
);
