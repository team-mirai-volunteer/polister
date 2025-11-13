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
import { requireAuth } from "@/shared/lib/auth/session";
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
  const session = await requireAuth();
  setupDI(container);

  const useCase = container.resolve(CreateBoardImportBatchUseCase);

  const buffer = Buffer.from(await input.file.arrayBuffer());
  const trimmedUploaderId = input.uploaderId?.trim() ?? "";
  const normalizedUploaderId =
    trimmedUploaderId.length > 0
      ? trimmedUploaderId
      : (session?.user?.id ?? null);

  const result = await useCase.execute({
    municipalityId: input.municipalityId,
    uploaderId: normalizedUploaderId,
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
