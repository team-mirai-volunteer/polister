"use server";

import "reflect-metadata";

import type { BoardImportRowDTO } from "@/features/board-import/application/dto/BoardImportBatchDTO";
import { UpdateBoardImportRowDecisionUseCase } from "@/features/board-import/application/usecases/UpdateBoardImportRowDecisionUseCase";
import {
  BOARD_IMPORT_ROW_DECISION_VALUES,
  type BoardImportRowDecision,
} from "@/features/board-import/domain/types/BoardImportTypes";
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

  const isValidDecision = (
    value: string | null
  ): value is BoardImportRowDecision | null => {
    if (value === null) {
      return true;
    }

    return BOARD_IMPORT_ROW_DECISION_VALUES.includes(
      value as BoardImportRowDecision
    );
  };

  if (!isValidDecision(input.decision ?? null)) {
    throw new Error(`Invalid decision value: ${input.decision}`);
  }

  return useCase.execute({
    rowId: input.rowId,
    decision: (input.decision ?? null) as BoardImportRowDecision | null,
    assigneeId: input.assigneeId ?? null,
    comment: input.comment ?? null,
  });
}
