import type { BoardImportRowDTO } from "@/features/board-import/application/dto/BoardImportBatchDTO";
import { toBoardImportRowDTO } from "@/features/board-import/application/dto/BoardImportDTOMapper";
import type { IBoardImportRepository } from "@/features/board-import/domain/repositories/IBoardImportRepository";
import type { BoardImportRowDecision } from "@/features/board-import/domain/types/BoardImportTypes";
import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";

export interface UpdateBoardImportRowDecisionInput {
  rowId: string;
  decision: BoardImportRowDecision | null;
  assigneeId?: string | null;
  comment?: string | null;
}

@injectable()
export class UpdateBoardImportRowDecisionUseCase {
  constructor(
    @inject(TOKENS.BoardImportRepository)
    private readonly repository: IBoardImportRepository
  ) {}

  async execute(
    input: UpdateBoardImportRowDecisionInput
  ): Promise<BoardImportRowDTO> {
    const updated = await this.repository.updateRowDecision(input.rowId, {
      finalDecision: input.decision ?? null,
      assigneeId: input.assigneeId ?? null,
      comment: input.comment ?? null,
    });

    const matchedBoards = await this.repository.findExistingBoardsByIds(
      updated.matchedBoardId ? [updated.matchedBoardId] : []
    );

    const matched = updated.matchedBoardId
      ? matchedBoards.find((board) => board.id === updated.matchedBoardId)
      : undefined;

    return toBoardImportRowDTO(updated, matched);
  }
}
