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
import type { BoardImportStorage } from "@/features/board-import/application/services/BoardImportStorage";
import type { IBoardImportRepository } from "@/features/board-import/domain/repositories/IBoardImportRepository";
import type { AppLogger } from "@/shared/lib/di/tokens";
import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";

export class BoardImportBatchNotFoundError extends Error {
  constructor(batchId: string) {
    super(`インポートバッチが見つかりません: ${batchId}`);
    this.name = "BoardImportBatchNotFoundError";
  }
}

export interface GetBoardImportBatchDetailInput {
  batchId: string;
}

export interface GetBoardImportBatchDetailOutput {
  batch: BoardImportBatchDTO;
  rows: BoardImportRowDTO[];
  missing: BoardImportMissingDTO[];
}

@injectable()
export class GetBoardImportBatchDetailUseCase {
  constructor(
    @inject(TOKENS.BoardImportRepository)
    private readonly repository: IBoardImportRepository,
    @inject(TOKENS.BoardImportStorage)
    private readonly storage: BoardImportStorage,
    @inject(TOKENS.Logger)
    private readonly logger: AppLogger
  ) {}

  async execute(
    input: GetBoardImportBatchDetailInput
  ): Promise<GetBoardImportBatchDetailOutput> {
    const batch = await this.repository.findBatchById(input.batchId);
    if (!batch) {
      throw new BoardImportBatchNotFoundError(input.batchId);
    }

    const [rows, missing] = await Promise.all([
      this.repository.findRowsByBatchId(batch.id),
      this.repository.findMissingByBatchId(batch.id),
    ]);

    const matchedIds = Array.from(
      new Set(rows.map((row) => row.matchedBoardId).filter(Boolean))
    ) as string[];

    const matchedBoards =
      await this.repository.findExistingBoardsByIds(matchedIds);
    const matchedMap = new Map(matchedBoards.map((board) => [board.id, board]));

    const downloadUrl = await this.storage
      .getDownloadUrl(batch.storagePath)
      .catch((error) => {
        this.logger.warn(
          "[BoardImport] Failed to resolve download URL for batch",
          error
        );
        return null;
      });

    const batchDTO = toBoardImportBatchDTO(batch, downloadUrl);
    const rowDTOs = rows.map((row) =>
      toBoardImportRowDTO(
        row,
        row.matchedBoardId ? matchedMap.get(row.matchedBoardId) : undefined
      )
    );
    const missingDTOs = missing.map((item) => toBoardImportMissingDTO(item));

    return {
      batch: batchDTO,
      rows: rowDTOs,
      missing: missingDTOs,
    };
  }
}
