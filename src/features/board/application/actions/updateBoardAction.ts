"use server";

/**
 * 掲示板更新 Action
 */

import "reflect-metadata";

import {
  UpdateBoardError,
  UpdateBoardUseCase,
  type UpdateBoardInput,
} from "@/features/board/application/usecases/UpdateBoardUseCase";
import { setupDI } from "@/shared/lib/di/container";

export interface UpdateBoardActionInput {
  boardId: string;
  boardNumber?: string | null;
  name?: string | null;
  address?: string;
  coordinates?: { latitude: number; longitude: number };
  status?: "PENDING" | "VERIFIED" | "REJECTED";
  trustLevel?: "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4";
  note?: string | null;
  changeReason: "MANUAL_INPUT" | "ERROR_CORRECTION" | "FIELD_VERIFICATION";
  userId?: string | null;
  comment?: string | null;
}

export interface UpdateBoardActionResult {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export async function updateBoardAction(
  input: UpdateBoardActionInput
): Promise<UpdateBoardActionResult> {
  const container = setupDI();
  const useCase = container.resolve(UpdateBoardUseCase);

  try {
    const useCaseInput: UpdateBoardInput = {
      boardId: input.boardId,
      boardNumber: input.boardNumber,
      name: input.name,
      address: input.address,
      coordinates: input.coordinates,
      status: input.status,
      trustLevel: input.trustLevel,
      note: input.note,
      changeReason: input.changeReason,
      userId: input.userId,
      comment: input.comment,
    };

    await useCase.execute(useCaseInput);

    return { success: true };
  } catch (error) {
    if (error instanceof UpdateBoardError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }

    // 予期しないエラー
    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "予期しないエラーが発生しました。",
      },
    };
  }
}
