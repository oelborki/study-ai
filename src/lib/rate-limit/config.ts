export type RateLimitType = "auth" | "generate" | "upload" | "general";

export interface RateLimitConfig {
  requests: number;
  windowSeconds: number;
}

export const RATE_LIMIT_CONFIGS: Record<RateLimitType, RateLimitConfig> = {
  auth: {
    requests: 5,
    windowSeconds: 60, // 5 requests per minute
  },
  generate: {
    requests: 10,
    windowSeconds: 60, // 10 requests per minute
  },
  upload: {
    requests: 5,
    windowSeconds: 60, // 5 requests per minute
  },
  general: {
    requests: 100,
    windowSeconds: 60, // 100 requests per minute
  },
};
