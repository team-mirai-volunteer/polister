import type { BoardImportBatchDTO } from "@/features/board-import/application/dto/BoardImportBatchDTO";
import { toBoardImportBatchDTO } from "@/features/board-import/application/dto/BoardImportDTOMapper";
import type { BoardImportStorage } from "@/features/board-import/application/services/BoardImportStorage";
import type {
  IBoardImportRepository,
  ListBoardImportBatchesFilter,
} from "@/features/board-import/domain/repositories/IBoardImportRepository";
import type { AppLogger } from "@/shared/lib/di/tokens";
import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";

export interface ListBoardImportBatchesInput
  extends Omit<ListBoardImportBatchesFilter, "limit"> {
  limit?: number;
}

@injectable()
export class ListBoardImportBatchesUseCase {
  constructor(
    @inject(TOKENS.BoardImportRepository)
    private readonly repository: IBoardImportRepository,
    @inject(TOKENS.BoardImportStorage)
    private readonly storage: BoardImportStorage,
    @inject(TOKENS.Logger)
    private readonly logger: AppLogger
  ) {}

  async execute(
    input: ListBoardImportBatchesInput = {}
  ): Promise<BoardImportBatchDTO[]> {
    const batches = await this.repository.listBatches({
      municipalityId: input.municipalityId,
      status: input.status,
      uploadedBy: input.uploadedBy,
      limit: input.limit ?? 20,
      cursor: input.cursor,
    });

    const downloadUrls = await Promise.all(
      batches.map((batch) =>
        this.storage.getDownloadUrl(batch.storagePath).catch((error) => {
          this.logger.warn(
            "[BoardImport] Failed to resolve batch download URL",
            error
          );
          return null;
        })
      )
    );

    return batches.map((batch, index) =>
      toBoardImportBatchDTO(batch, downloadUrls[index])
    );
  }
}
