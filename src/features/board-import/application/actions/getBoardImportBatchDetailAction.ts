"use server";

import "reflect-metadata";

import type {
  BoardImportBatchDTO,
  BoardImportMissingDTO,
  BoardImportRowDTO,
} from "@/features/board-import/application/dto/BoardImportBatchDTO";
import { GetBoardImportBatchDetailUseCase } from "@/features/board-import/application/usecases/GetBoardImportBatchDetailUseCase";
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
  setupDI(container);

  try {
    const useCase = container.resolve(GetBoardImportBatchDetailUseCase);

    return await useCase.execute({ batchId: input.batchId });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("インポートバッチ詳細の取得に失敗しました。");
  }
}
