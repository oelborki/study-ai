import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
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
