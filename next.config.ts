import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: [
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
          // Enforces HTTPS connections
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.anthropic.com https://*.upstash.io https://*.sentry.io",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          // Prevents XSS attacks in older browsers
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

// Only apply Sentry config when DSN is set
const sentryConfig = process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      // Sentry organization and project
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,

      // Upload source maps for better stack traces and hide from users
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },

      // Disable Sentry telemetry
      telemetry: false,

      // Silence build logs
      silent: !process.env.CI,
    })
  : nextConfig;

export default sentryConfig;
