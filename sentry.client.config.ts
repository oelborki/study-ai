import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Performance monitoring sample rate
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Debug mode in development
  debug: false,

  // Replay configuration (optional - disabled to save quota)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Filter out browser extension errors and other noise
  beforeSend(event) {
    // Filter browser extension errors
    if (event.exception?.values) {
      const isExtensionError = event.exception.values.some((exception) => {
        const frames = exception.stacktrace?.frames || [];
        return frames.some(
          (frame) =>
            frame.filename?.includes("chrome-extension://") ||
            frame.filename?.includes("moz-extension://") ||
            frame.filename?.includes("safari-extension://")
        );
      });
      if (isExtensionError) {
        return null;
      }
    }
    return event;
  },

  // Scrub sensitive data from breadcrumb URLs
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === "fetch" || breadcrumb.category === "xhr") {
      const url = breadcrumb.data?.url;
      if (typeof url === "string" && breadcrumb.data) {
        // Remove tokens and keys from URLs
        breadcrumb.data.url = url
          .replace(/token=[^&]+/gi, "token=[REDACTED]")
          .replace(/key=[^&]+/gi, "key=[REDACTED]")
          .replace(/password=[^&]+/gi, "password=[REDACTED]");
      }
    }
    return breadcrumb;
  },
});
