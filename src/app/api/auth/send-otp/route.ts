import { NextRequest, NextResponse } from "next/server";
import { sendOtpSchema } from "@/lib/validators/auth.validator";
import { otpService } from "@/lib/services/otp.service";
import { AppError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "phone";
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return NextResponse.json(
        { success: false, error: "Validation failed", details: fieldErrors },
        { status: 400 },
      );
    }

    await otpService.sendOtp(parsed.data.phone, "login");

    return NextResponse.json({
      success: true,
      message: "OTP sent via WhatsApp",
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.statusCode },
      );
    }
    console.error("[send-otp] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
