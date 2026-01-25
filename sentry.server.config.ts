import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Performance monitoring sample rate
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Debug mode
  debug: false,

  // Redact sensitive headers and request body fields
  beforeSend(event) {
    // Redact sensitive headers
    if (event.request?.headers) {
      const sensitiveHeaders = ["authorization", "cookie", "x-auth-token"];
      for (const header of sensitiveHeaders) {
        if (event.request.headers[header]) {
          event.request.headers[header] = "[REDACTED]";
        }
      }
    }

    // Redact sensitive fields from request body
    if (event.request?.data && typeof event.request.data === "object") {
      const sensitiveFields = [
        "password",
        "token",
        "secret",
        "apiKey",
        "api_key",
        "accessToken",
        "access_token",
        "refreshToken",
        "refresh_token",
      ];
      const data = event.request.data as Record<string, unknown>;
      for (const field of sensitiveFields) {
        if (field in data) {
          data[field] = "[REDACTED]";
        }
      }
    }

    return event;
  },

  // Capture unhandled promise rejections
  integrations: [
    Sentry.captureConsoleIntegration({
      levels: ["error"],
    }),
  ],
});
