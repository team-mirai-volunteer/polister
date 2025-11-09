"use server";

/**
 * 掲示板詳細取得 Action
 */

import "reflect-metadata";

import {
  mapBoardHistoryToDTO,
  mapBoardToDTO,
  type GetBoardDetailResponseDTO,
} from "@/features/board/application/dto/BoardDetailDTO";
import { GetBoardDetailUseCase } from "@/features/board/application/usecases/GetBoardDetailUseCase";
import { setupDI } from "@/shared/lib/di/container";

export async function getBoardDetailAction(
  boardId: string
): Promise<GetBoardDetailResponseDTO | null> {
  const container = setupDI();
  const useCase = container.resolve(GetBoardDetailUseCase);

  const result = await useCase.execute(boardId);

  if (!result) {
    return null;
  }

  return {
    board: mapBoardToDTO(result.board),
    histories: result.histories.map(mapBoardHistoryToDTO),
  };
}
