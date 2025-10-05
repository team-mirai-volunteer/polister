export type LogLevel = "debug" | "info" | "warn" | "error";

export interface ErrorMetadata {
  readonly [key: string]: unknown;
}

export interface ApplicationErrorOptions {
  readonly statusCode?: number;
  readonly code?: string;
  readonly cause?: unknown;
  readonly metadata?: ErrorMetadata;
  readonly logLevel?: LogLevel;
}

export class ApplicationError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly metadata?: ErrorMetadata;
  readonly logLevel: LogLevel;

  constructor(message: string, options?: ApplicationErrorOptions) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = options?.code ?? new.target.name;
    this.code = options?.code ?? new.target.name;
    this.statusCode = options?.statusCode ?? 500;
    this.metadata = options?.metadata;
    this.logLevel = options?.logLevel ?? "error";

    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message = "入力値が不正です", options?: ApplicationErrorOptions) {
    super(message, {
      statusCode: 400,
      code: options?.code ?? "VALIDATION_ERROR",
      metadata: options?.metadata,
      cause: options?.cause,
      logLevel: options?.logLevel ?? "warn",
    });
  }
}

export class BoardNotFoundError extends ApplicationError {
  constructor(
    message = "掲示板が見つかりません",
    options?: ApplicationErrorOptions
  ) {
    super(message, {
      statusCode: 404,
      code: options?.code ?? "BOARD_NOT_FOUND",
      metadata: options?.metadata,
      cause: options?.cause,
      logLevel: options?.logLevel ?? "warn",
    });
  }
}

export class MunicipalityNotFoundError extends ApplicationError {
  constructor(
    message = "自治体が見つかりません",
    options?: ApplicationErrorOptions
  ) {
    super(message, {
      statusCode: 404,
      code: options?.code ?? "MUNICIPALITY_NOT_FOUND",
      metadata: options?.metadata,
      cause: options?.cause,
      logLevel: options?.logLevel ?? "warn",
    });
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message = "認証が必要です", options?: ApplicationErrorOptions) {
    super(message, {
      statusCode: 401,
      code: options?.code ?? "UNAUTHORIZED",
      metadata: options?.metadata,
      cause: options?.cause,
      logLevel: options?.logLevel ?? "warn",
    });
  }
}
