"use server";

import "reflect-metadata";

import { DeleteBoardImportBatchUseCase } from "@/features/board-import/application/usecases/DeleteBoardImportBatchUseCase";
import { BoardImportBatchNotFoundError } from "@/features/board-import/application/usecases/GetBoardImportBatchDetailUseCase";
import { setupDI } from "@/shared/lib/di/container";
import { container } from "tsyringe";

interface DeleteBoardImportBatchInput {
  batchId: string;
}

interface DeleteBoardImportBatchResult {
  success: boolean;
  error?: string;
}

export async function deleteBoardImportBatchAction(
  input: DeleteBoardImportBatchInput
): Promise<DeleteBoardImportBatchResult> {
  setupDI(container);

  try {
    const useCase = container.resolve(DeleteBoardImportBatchUseCase);
    await useCase.execute({ batchId: input.batchId });
    return { success: true };
  } catch (error) {
    console.error("[deleteBoardImportBatchAction] Failed", error);

    if (error instanceof BoardImportBatchNotFoundError) {
      return { success: false, error: "not_found" };
    }

    return { success: false, error: "unknown_error" };
  }
}
