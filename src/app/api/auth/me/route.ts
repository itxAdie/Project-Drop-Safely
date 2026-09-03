import { NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { authService } from "@/lib/services/auth.service";
import { AppError } from "@/lib/errors";

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const profile = await authService.getProfile(request.user.id);

    return NextResponse.json({
      success: true,
      ...profile,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.statusCode },
      );
    }
    console.error("[me] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
});
