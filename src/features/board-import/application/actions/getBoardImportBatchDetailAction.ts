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

  const useCase = container.resolve(GetBoardImportBatchDetailUseCase);

  return useCase.execute({ batchId: input.batchId });
}
