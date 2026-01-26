import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { RATE_LIMIT_CONFIGS, type RateLimitType } from "./config";
import { logError, logWarn } from "@/lib/logger";

let redis: Redis | null = null;
const rateLimiters = new Map<RateLimitType, Ratelimit>();

/**
 * Initialize Redis connection if credentials are available
 */
function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    redis = new Redis({ url, token });
    return redis;
  } catch (error) {
    logError("Failed to initialize Redis for rate limiting", error);
    return null;
  }
}

/**
 * Get or create a rate limiter for a specific type
 */
function getRateLimiter(type: RateLimitType): Ratelimit | null {
  const redisClient = getRedis();
  if (!redisClient) return null;

  if (rateLimiters.has(type)) {
    return rateLimiters.get(type)!;
  }

  const config = RATE_LIMIT_CONFIGS[type];
  const limiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(config.requests, `${config.windowSeconds} s`),
    analytics: true,
    prefix: `ratelimit:${type}`,
  });

  rateLimiters.set(type, limiter);
  return limiter;
}

/**
 * Get client identifier for rate limiting
 * Uses IP address from headers, falling back to a generic identifier
 */
async function getClientIdentifier(): Promise<string> {
  try {
    const headersList = await headers();
    // Check common headers for client IP
    const forwarded = headersList.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    const realIp = headersList.get("x-real-ip");
    if (realIp) {
      return realIp;
    }
  } catch {
    // Headers may not be available in some contexts
  }
  return "anonymous";
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a specific type and identifier
 * Returns success:true if the request is allowed, or success:false if rate limited
 * Gracefully skips rate limiting if Upstash credentials are not configured
 */
export async function checkRateLimit(
  type: RateLimitType,
  identifier?: string
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(type);

  // Gracefully skip if rate limiting is not configured
  if (!limiter) {
    logWarn("Rate limiting skipped: Upstash Redis not configured", {
      type,
    });
    return {
      success: true,
      limit: RATE_LIMIT_CONFIGS[type].requests,
      remaining: RATE_LIMIT_CONFIGS[type].requests,
      reset: Date.now() + RATE_LIMIT_CONFIGS[type].windowSeconds * 1000,
    };
  }

  const id = identifier || (await getClientIdentifier());
  const key = `${type}:${id}`;

  try {
    const result = await limiter.limit(key);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    logError("Rate limit check failed", error, { type, identifier: id });
    // Allow request on error to avoid blocking users due to Redis issues
    return {
      success: true,
      limit: RATE_LIMIT_CONFIGS[type].requests,
      remaining: RATE_LIMIT_CONFIGS[type].requests,
      reset: Date.now() + RATE_LIMIT_CONFIGS[type].windowSeconds * 1000,
    };
  }
}

/**
 * Create a rate limit exceeded response with proper headers
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: "Too many requests. Please try again later.",
      retryAfter,
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
        "Retry-After": retryAfter.toString(),
      },
    }
  );
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.reset.toString());
  return response;
}

// Re-export config types
export { RATE_LIMIT_CONFIGS, type RateLimitType, type RateLimitConfig } from "./config";
