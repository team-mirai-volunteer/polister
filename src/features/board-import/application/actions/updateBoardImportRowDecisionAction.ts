"use server";

import "reflect-metadata";

import type { BoardImportRowDTO } from "@/features/board-import/application/dto/BoardImportBatchDTO";
import { UpdateBoardImportRowDecisionUseCase } from "@/features/board-import/application/usecases/UpdateBoardImportRowDecisionUseCase";
import type { BoardImportRowDecision } from "@/features/board-import/domain/types/BoardImportTypes";
import { setupDI } from "@/shared/lib/di/container";
import { container } from "tsyringe";

export interface UpdateBoardImportRowDecisionActionInput {
  rowId: string;
  decision: string | null;
  assigneeId?: string | null;
  comment?: string | null;
}

export async function updateBoardImportRowDecisionAction(
  input: UpdateBoardImportRowDecisionActionInput
): Promise<BoardImportRowDTO> {
  setupDI(container);

  const useCase = container.resolve(UpdateBoardImportRowDecisionUseCase);

  return useCase.execute({
    rowId: input.rowId,
    decision: input.decision as BoardImportRowDecision | null,
    assigneeId: input.assigneeId ?? null,
    comment: input.comment ?? null,
  });
}
