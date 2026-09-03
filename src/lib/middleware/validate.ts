import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "@/lib/errors";

type BodyValidation = "body";
type QueryValidation = "query";
type ParamsValidation = "params";

interface ValidateOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidateOptions) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string | string[]>> },
  ): Promise<{
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
    params?: Record<string, string | string[]>;
  }> => {
    const result: Record<string, unknown> = {};
    const errors: Record<string, string[]> = {};

    // Validate body
    if (schemas.body) {
      try {
        const body = await request.json();
        result.body = schemas.body.parse(body);
      } catch (e) {
        if (e instanceof ZodError) {
          for (const issue of e.issues) {
            const path = issue.path.join(".") || "body";
            if (!errors[path]) errors[path] = [];
            errors[path].push(issue.message);
          }
        }
      }
    }

    // Validate query
    if (schemas.query) {
      try {
        const queryObj = Object.fromEntries(request.nextUrl.searchParams.entries());
        result.query = schemas.query.parse(queryObj);
      } catch (e) {
        if (e instanceof ZodError) {
          for (const issue of e.issues) {
            const path = `query.${issue.path.join(".")}`;
            if (!errors[path]) errors[path] = [];
            errors[path].push(issue.message);
          }
        }
      }
    }

    // Validate params
    if (schemas.params) {
      try {
        const params = await context.params;
        result.params = schemas.params.parse(params);
      } catch (e) {
        if (e instanceof ZodError) {
          for (const issue of e.issues) {
            const path = `params.${issue.path.join(".")}`;
            if (!errors[path]) errors[path] = [];
            errors[path].push(issue.message);
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError("Validation failed", errors);
    }

    return result as {
      body?: Record<string, unknown>;
      query?: Record<string, unknown>;
      params?: Record<string, string | string[]>;
    };
  };
}

export function withValidation<T>(
  schema: ZodSchema<T>,
  source: BodyValidation | QueryValidation | ParamsValidation = "body",
) {
  return validate({ [source]: schema });
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".") || "root";
      if (!details[path]) details[path] = [];
      details[path].push(issue.message);
    }
    return NextResponse.json(
      { success: false, error: "Validation failed", details },
      { status: 400 },
    );
  }

  if (error && typeof error === "object" && "statusCode" in error) {
    const appError = error as { statusCode: number; message: string; details?: Record<string, string[]> };
    return NextResponse.json(
      { success: false, error: appError.message, details: appError.details },
      { status: appError.statusCode },
    );
  }

  console.error("Unhandled API error:", error);
  return NextResponse.json(
    { success: false, error: "Internal server error" },
    { status: 500 },
  );
}
