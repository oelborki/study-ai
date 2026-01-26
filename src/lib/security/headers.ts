/**
 * Security headers configuration for Next.js
 * These headers help protect against common web vulnerabilities
 */

export interface SecurityHeader {
  key: string;
  value: string;
}

/**
 * Content Security Policy directives
 * Note: 'unsafe-inline' for scripts is required by Next.js
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'", // Required for Next.js
  "style-src 'self' 'unsafe-inline'", // Required for styled-jsx and inline styles
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.anthropic.com https://*.upstash.io https://*.sentry.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export const securityHeaders: SecurityHeader[] = [
  // Prevents clickjacking attacks
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Prevents MIME type sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Controls referrer information sent with requests
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Disables browser features that are not needed
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Enforces HTTPS connections (only in production)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  // Prevents XSS attacks in older browsers
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
];
