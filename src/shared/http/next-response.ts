import { NextResponse } from "next/server";

import { ApplicationError } from "@/shared/errors/application-error";
import {
  createErrorResponseBody,
  createSuccessResult,
} from "@/shared/http/response";
import { logError } from "@/shared/logging/logger";

export const createJsonResponse = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json(createSuccessResult(data), init);

export const createErrorResponse = (error: unknown) => {
  if (error instanceof ApplicationError) {
    logError(error);
    return NextResponse.json(createErrorResponseBody(error), {
      status: error.statusCode,
    });
  }

  logError(error);
  return NextResponse.json(createErrorResponseBody(error), {
    status: 500,
  });
};
