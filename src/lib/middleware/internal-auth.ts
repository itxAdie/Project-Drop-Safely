import { NextRequest, NextResponse } from "next/server";

/**
 * Wraps an internal API route handler with x-api-secret authentication.
 * Used for service-to-service calls from the WhatsApp micro-service.
 */
export function withInternalAuth(
  handler: (
    request: NextRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => Promise<NextResponse>,
) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => {
    const secret = request.headers.get("x-api-secret");
    const expected = process.env.WHATSAPP_SERVICE_SECRET;

    if (!secret || !expected || secret !== expected) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    return handler(request, context);
  };
}
