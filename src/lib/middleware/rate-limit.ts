import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  lastReset: number;
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
};

export function rateLimit(config: Partial<RateLimitConfig> = {}) {
  const { windowMs, maxRequests } = { ...DEFAULT_CONFIG, ...config };

  return (request: NextRequest): NextResponse | null => {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const key = `${ip}:${request.nextUrl.pathname}`;
    const now = Date.now();

    const entry = store.get(key);

    if (!entry || now - entry.lastReset > windowMs) {
      store.set(key, { count: 1, lastReset: now });
      return null;
    }

    entry.count++;

    if (entry.count > maxRequests) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    return null;
  };
}

// Singleton limiter for auth endpoints (stricter)
export const authRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 5 });

// General API limiter
export const apiRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 60 });
