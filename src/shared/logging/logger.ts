import { ApplicationError } from "@/shared/errors/application-error";

export interface Logger {
  debug: (...messages: unknown[]) => void;
  info: (...messages: unknown[]) => void;
  warn: (...messages: unknown[]) => void;
  error: (...messages: unknown[]) => void;
}

const consoleLogger: Logger = {
  debug: (...messages) => console.debug(...messages),
  info: (...messages) => console.info(...messages),
  warn: (...messages) => console.warn(...messages),
  error: (...messages) => console.error(...messages),
};

export const logger = consoleLogger;

export const logError = (error: unknown, context?: Record<string, unknown>) => {
  if (error instanceof ApplicationError) {
    logger[error.logLevel](
      {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        metadata: error.metadata,
        context,
      },
      error.cause
    );
    return;
  }

  if (error instanceof Error) {
    logger.error(
      {
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
        context,
      },
      error.stack
    );
    return;
  }

  logger.error({
    code: "UNKNOWN_ERROR",
    message: "未知のエラーが発生しました",
    context,
    value: error,
  });
};
