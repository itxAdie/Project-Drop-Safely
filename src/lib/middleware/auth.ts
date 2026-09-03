import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";
import type { AuthUser } from "@/types/api";
import type { UserRole } from "@/types/enums";

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

// ── Core helpers ────────────────────────────────────────────────────────────

export async function verifyToken(token: string): Promise<AuthUser> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      id: payload.sub as string,
      phone: payload.phone as string | undefined,
      email: payload.email as string | undefined,
      role: payload.role as AuthUser["role"],
    };
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

export async function extractUser(request: NextRequest): Promise<AuthUser> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("No token provided");
  }

  const token = authHeader.slice(7);
  return verifyToken(token);
}

// ── withAuth wrapper ────────────────────────────────────────────────────────

export interface AuthenticatedRequest extends NextRequest {
  user: AuthUser;
}

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string | string[]>> },
) => Promise<NextResponse>;

/**
 * Wraps a route handler with JWT authentication and optional role-based
 * access control.
 *
 * Usage:
 *   export const GET = withAuth(async (req) => { ... });
 *   export const POST = withAuth(async (req) => { ... }, ["admin"]);
 */
export function withAuth(
  handler: (
    request: AuthenticatedRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ) => Promise<NextResponse>,
  roles?: UserRole[],
): RouteHandler {
  return async (request, context) => {
    const user = await extractUser(request);

    if (roles && roles.length > 0 && !roles.includes(user.role)) {
      throw new ForbiddenError(
        "You do not have permission to access this resource",
      );
    }

    // Attach user to the request object for downstream access
    (request as AuthenticatedRequest).user = user;
    request.headers.set("x-user-id", user.id);
    request.headers.set("x-user-role", user.role);

    return handler(request as AuthenticatedRequest, context);
  };
}

/**
 * @deprecated Use jose SignJWT directly — kept for backward compatibility.
 */
export function createToken(
  payload: Record<string, unknown>,
  expirySeconds = 900,
): string {
  void payload;
  void expirySeconds;
  throw new Error("Use jose SignJWT directly for token creation");
}
