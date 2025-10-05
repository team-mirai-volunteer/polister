import {
  ApplicationError,
  ErrorMetadata,
} from "@/shared/errors/application-error";

export interface ApiErrorPayload {
  readonly code: string;
  readonly message: string;
  readonly statusCode: number;
  readonly metadata?: ErrorMetadata;
}

export type OperationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: ApiErrorPayload };

export const createSuccessResult = <T>(data: T): OperationResult<T> => ({
  success: true,
  data,
});

export const createErrorResult = (error: unknown): OperationResult<never> => ({
  success: false,
  error: toApiErrorPayload(error),
});

export const toApiErrorPayload = (error: unknown): ApiErrorPayload => {
  if (error instanceof ApplicationError) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      metadata: error.metadata,
    };
  }

  const message = "予期しないエラーが発生しました";

  if (error instanceof Error) {
    return {
      code: "INTERNAL_SERVER_ERROR",
      message,
      statusCode: 500,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message,
    statusCode: 500,
  };
};

export const createErrorResponseBody = (
  error: unknown
): { readonly error: ApiErrorPayload } => ({
  error: toApiErrorPayload(error),
});
