import * as Sentry from "@sentry/nextjs";
import type { Logger as PinoLogger } from "pino";

// Determine if we're running on the server
const isServer = typeof window === "undefined";

// Redaction paths for sensitive fields
const redactPaths = [
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "apiKey",
  "api_key",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
];

// Server-side logger using pino
let pinoLogger: PinoLogger | null = null;

async function getServerLogger() {
  if (pinoLogger) return pinoLogger;

  if (isServer) {
    const pino = (await import("pino")).default;
    const isDev = process.env.NODE_ENV !== "production";

    pinoLogger = pino({
      level: process.env.LOG_LEVEL || "info",
      redact: {
        paths: redactPaths.flatMap((field) => [
          field,
          `*.${field}`,
          `*.*.${field}`,
        ]),
        censor: "[REDACTED]",
      },
      ...(isDev
        ? {
            transport: {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
              },
            },
          }
        : {}),
    });
  }

  return pinoLogger;
}

// Logger interface for both server and client
interface LogContext {
  [key: string]: unknown;
}

interface Logger {
  info: (message: string, context?: LogContext) => Promise<void>;
  warn: (message: string, context?: LogContext) => Promise<void>;
  error: (message: string, context?: LogContext) => Promise<void>;
  debug: (message: string, context?: LogContext) => Promise<void>;
}

/**
 * Log an error with optional context. Sends to Sentry in production.
 */
export async function logError(
  message: string,
  error: unknown,
  context?: LogContext
): Promise<void> {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  const safeContext = context ? redactSensitiveData(context) : {};

  if (isServer) {
    const logger = await getServerLogger();
    logger?.error({ err: errorObj, ...safeContext }, message);
  } else {
    console.error(message, errorObj, safeContext);
  }

  Sentry.captureException(errorObj, {
    extra: {
      message,
      ...safeContext,
    },
  });
}

/**
 * Log a warning with optional context.
 */
export async function logWarn(
  message: string,
  context?: LogContext
): Promise<void> {
  const safeContext = context ? redactSensitiveData(context) : {};

  if (isServer) {
    const logger = await getServerLogger();
    logger?.warn(safeContext, message);
  } else {
    console.warn(message, safeContext);
  }
}

/**
 * Create a child logger with request context
 */
export function createLogger(context: LogContext): Logger {
  const safeContext = redactSensitiveData(context);

  if (isServer) {
    return {
      info: async (message: string, additionalContext?: LogContext) => {
        const logger = await getServerLogger();
        logger?.info({ ...safeContext, ...redactSensitiveData(additionalContext || {}) }, message);
      },
      warn: async (message: string, additionalContext?: LogContext) => {
        const logger = await getServerLogger();
        logger?.warn({ ...safeContext, ...redactSensitiveData(additionalContext || {}) }, message);
      },
      error: async (message: string, additionalContext?: LogContext) => {
        const logger = await getServerLogger();
        logger?.error({ ...safeContext, ...redactSensitiveData(additionalContext || {}) }, message);
      },
      debug: async (message: string, additionalContext?: LogContext) => {
        const logger = await getServerLogger();
        logger?.debug({ ...safeContext, ...redactSensitiveData(additionalContext || {}) }, message);
      },
    };
  }

  // Client-side fallback
  return {
    info: async (message: string, additionalContext?: LogContext) => {
      console.info(message, { ...safeContext, ...redactSensitiveData(additionalContext || {}) });
    },
    warn: async (message: string, additionalContext?: LogContext) => {
      console.warn(message, { ...safeContext, ...redactSensitiveData(additionalContext || {}) });
    },
    error: async (message: string, additionalContext?: LogContext) => {
      console.error(message, { ...safeContext, ...redactSensitiveData(additionalContext || {}) });
    },
    debug: async (message: string, additionalContext?: LogContext) => {
      console.debug(message, { ...safeContext, ...redactSensitiveData(additionalContext || {}) });
    },
  };
}

/**
 * Redact sensitive fields from an object
 */
function redactSensitiveData(data: LogContext): LogContext {
  const result: LogContext = {};

  for (const [key, value] of Object.entries(data)) {
    if (redactPaths.some((path) => key.toLowerCase().includes(path))) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      result[key] = redactSensitiveData(value as LogContext);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// Default logger for general use
export const logger = createLogger({});
