"use server";

import "reflect-metadata";

import type {
  BoardImportBatchDTO,
  BoardImportMissingDTO,
  BoardImportRowDTO,
} from "@/features/board-import/application/dto/BoardImportBatchDTO";
import {
  BoardImportBatchNotFoundError,
  GetBoardImportBatchDetailUseCase,
} from "@/features/board-import/application/usecases/GetBoardImportBatchDetailUseCase";
import { requireAuth } from "@/shared/lib/auth/session";
import { setupDI } from "@/shared/lib/di/container";
import { container } from "tsyringe";

export interface GetBoardImportBatchDetailActionInput {
  batchId: string;
}

export interface GetBoardImportBatchDetailActionOutput {
  batch: BoardImportBatchDTO;
  rows: BoardImportRowDTO[];
  missing: BoardImportMissingDTO[];
}

export async function getBoardImportBatchDetailAction(
  input: GetBoardImportBatchDetailActionInput
): Promise<GetBoardImportBatchDetailActionOutput> {
  await requireAuth();
  setupDI(container);

  try {
    const useCase = container.resolve(GetBoardImportBatchDetailUseCase);

    return await useCase.execute({ batchId: input.batchId });
  } catch (error) {
    console.error(
      "[getBoardImportBatchDetailAction] Failed to load batch detail",
      error
    );

    if (error instanceof BoardImportBatchNotFoundError) {
      throw error;
    }

    throw new Error("インポートバッチ詳細の取得に失敗しました。");
  }
}
