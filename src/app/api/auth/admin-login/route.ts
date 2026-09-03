import { NextRequest, NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validators/auth.validator";
import { authService } from "@/lib/services/auth.service";
import { AppError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "body";
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return NextResponse.json(
        { success: false, error: "Validation failed", details: fieldErrors },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;
    const result = await authService.adminLogin(email, password);

    return NextResponse.json({
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.statusCode },
      );
    }
    console.error("[admin-login] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
