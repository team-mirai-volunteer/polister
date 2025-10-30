"use server";

import "reflect-metadata";

import type {
  BoardImportBatchDTO,
  BoardImportMissingDTO,
  BoardImportRowDTO,
} from "@/features/board-import/application/dto/BoardImportBatchDTO";
import {
  toBoardImportBatchDTO,
  toBoardImportMissingDTO,
  toBoardImportRowDTO,
} from "@/features/board-import/application/dto/BoardImportDTOMapper";
import { CreateBoardImportBatchUseCase } from "@/features/board-import/application/usecases/CreateBoardImportBatchUseCase";
import { setupDI } from "@/shared/lib/di/container";
import { container } from "tsyringe";

export interface CreateBoardImportBatchActionInput {
  municipalityId: string;
  uploaderId?: string;
  file: File;
  notes?: string | null;
}

export interface CreateBoardImportBatchActionOutput {
  batch: BoardImportBatchDTO;
  rows: BoardImportRowDTO[];
  missing: BoardImportMissingDTO[];
}

export async function createBoardImportBatchAction(
  input: CreateBoardImportBatchActionInput
): Promise<CreateBoardImportBatchActionOutput> {
  setupDI(container);

  const useCase = container.resolve(CreateBoardImportBatchUseCase);

  const buffer = Buffer.from(await input.file.arrayBuffer());

  const result = await useCase.execute({
    municipalityId: input.municipalityId,
    uploaderId: input.uploaderId?.trim() || null,
    fileName: input.file.name,
    buffer,
    contentType: input.file.type,
    notes: input.notes ?? null,
  });

  const batchDTO = toBoardImportBatchDTO(result.batch, result.downloadUrl);
  const rowsDTO = result.rows.map((row) =>
    toBoardImportRowDTO(row, result.matchedBoards.get(row.matchedBoardId ?? ""))
  );
  const missingDTO = result.missing.map((item) =>
    toBoardImportMissingDTO(item)
  );

  return {
    batch: batchDTO,
    rows: rowsDTO,
    missing: missingDTO,
  };
}
