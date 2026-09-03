import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/services/auth.service";
import { AppError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body as { refreshToken?: string };

    if (!refreshToken || typeof refreshToken !== "string") {
      return NextResponse.json(
        { success: false, error: "Refresh token is required" },
        { status: 400 },
      );
    }

    const tokens = await authService.refreshToken(refreshToken);

    return NextResponse.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.statusCode },
      );
    }
    console.error("[refresh] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
