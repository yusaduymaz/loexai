import "server-only";

import * as Sentry from "@sentry/nextjs";

type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

function write(level: LogLevel, message: string, context?: LogContext) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  const line = JSON.stringify(payload);

  switch (level) {
    case "debug":
    case "info":
      console.log(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "error":
      console.error(line);
      break;
  }
}

export const logger = {
  debug(message: string, context?: LogContext) {
    write("debug", message, context);
  },
  info(message: string, context?: LogContext) {
    write("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    write("warn", message, context);
  },
  error(message: string, error?: unknown, context?: LogContext) {
    write("error", message, {
      ...context,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    });

    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: context,
      });
    }
  },
};

