"use server";

import "reflect-metadata";

import type { BoardImportBatchDTO } from "@/features/board-import/application/dto/BoardImportBatchDTO";
import { ListBoardImportBatchesUseCase } from "@/features/board-import/application/usecases/ListBoardImportBatchesUseCase";
import {
  BOARD_IMPORT_STATUS_VALUES,
  type BoardImportStatus,
} from "@/features/board-import/domain/types/BoardImportTypes";
import { setupDI } from "@/shared/lib/di/container";
import { container } from "tsyringe";

export interface ListBoardImportBatchesActionInput {
  municipalityId?: string;
  status?: string;
  uploadedBy?: string;
  limit?: number;
  cursor?: string;
}

export interface ListBoardImportBatchesActionOutput {
  items: BoardImportBatchDTO[];
  nextCursor: string | null;
}

export async function listBoardImportBatchesAction(
  input: ListBoardImportBatchesActionInput = {}
): Promise<ListBoardImportBatchesActionOutput> {
  setupDI(container);

  const useCase = container.resolve(ListBoardImportBatchesUseCase);

  const normalizedStatus = ((): BoardImportStatus | undefined => {
    if (typeof input.status !== "string") {
      return undefined;
    }

    return BOARD_IMPORT_STATUS_VALUES.includes(
      input.status as BoardImportStatus
    )
      ? (input.status as BoardImportStatus)
      : undefined;
  })();

  try {
    return await useCase.execute({
      municipalityId: input.municipalityId,
      status: normalizedStatus,
      uploadedBy: input.uploadedBy,
      limit: input.limit,
      cursor: input.cursor,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("インポートバッチ一覧の取得に失敗しました。");
  }
}
