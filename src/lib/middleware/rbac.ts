import { NextRequest, NextResponse } from "next/server";
import { ForbiddenError } from "@/lib/errors";
import { extractUser } from "./auth";
import type { AuthUser } from "@/types/api";
import type { UserRole } from "@/types/enums";

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string | string[]>> },
) => Promise<NextResponse>;

export function requireRole(...roles: UserRole[]) {
  return (handler: RouteHandler) => {
    return async (
      request: NextRequest,
      context: { params: Promise<Record<string, string | string[]>> },
    ): Promise<NextResponse> => {
      const user: AuthUser = await extractUser(request);

      if (!roles.includes(user.role)) {
        throw new ForbiddenError("You do not have permission to access this resource");
      }

      // Attach user to request headers for downstream use
      request.headers.set("x-user-id", user.id);
      request.headers.set("x-user-role", user.role);

      return handler(request, context);
    };
  };
}
