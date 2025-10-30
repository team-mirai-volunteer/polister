"use server";

import "reflect-metadata";

import type { BoardImportBatchDTO } from "@/features/board-import/application/dto/BoardImportBatchDTO";
import { ListBoardImportBatchesUseCase } from "@/features/board-import/application/usecases/ListBoardImportBatchesUseCase";
import type { BoardImportStatus } from "@/features/board-import/domain/types/BoardImportTypes";
import { setupDI } from "@/shared/lib/di/container";
import { container } from "tsyringe";

export interface ListBoardImportBatchesActionInput {
  municipalityId?: string;
  status?: string;
  uploadedBy?: string;
  limit?: number;
  cursor?: string;
}

export async function listBoardImportBatchesAction(
  input: ListBoardImportBatchesActionInput = {}
): Promise<BoardImportBatchDTO[]> {
  setupDI(container);

  const useCase = container.resolve(ListBoardImportBatchesUseCase);

  return useCase.execute({
    municipalityId: input.municipalityId,
    status: input.status as BoardImportStatus | undefined,
    uploadedBy: input.uploadedBy,
    limit: input.limit,
    cursor: input.cursor,
  });
}
