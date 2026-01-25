import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Lower sample rate for edge runtime
  tracesSampleRate: 0.05,

  // Debug mode
  debug: false,
});
