import type { BoardImportBatchDTO } from "@/features/board-import/application/dto/BoardImportBatchDTO";
import { toBoardImportBatchDTO } from "@/features/board-import/application/dto/BoardImportDTOMapper";
import type {
  IBoardImportRepository,
  ListBoardImportBatchesFilter,
} from "@/features/board-import/domain/repositories/IBoardImportRepository";
import type { IStorageService } from "@/infrastructure/storage/IStorageService";
import type { AppLogger } from "@/shared/lib/di/tokens";
import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";

export interface ListBoardImportBatchesInput
  extends Omit<ListBoardImportBatchesFilter, "limit"> {
  limit?: number;
}

export interface ListBoardImportBatchesOutput {
  items: BoardImportBatchDTO[];
  nextCursor: string | null;
}

@injectable()
export class ListBoardImportBatchesUseCase {
  constructor(
    @inject(TOKENS.BoardImportRepository)
    private readonly repository: IBoardImportRepository,
    @inject(TOKENS.StorageService)
    private readonly storage: IStorageService,
    @inject(TOKENS.Logger)
    private readonly logger: AppLogger
  ) {}

  async execute(
    input: ListBoardImportBatchesInput = {}
  ): Promise<ListBoardImportBatchesOutput> {
    const limit = input.limit ?? 20;
    const { items: batches, nextCursor } = await this.repository.listBatches({
      municipalityId: input.municipalityId,
      status: input.status,
      uploadedBy: input.uploadedBy,
      limit,
      cursor: input.cursor,
    });

    const downloadUrls = await Promise.all(
      batches.map(async (batch) => {
        try {
          return await this.storage.getPublicUrl(batch.storagePath);
        } catch (error) {
          this.logger.error(
            "[BoardImport] Failed to resolve batch download URL",
            {
              batchId: batch.id,
              storagePath: batch.storagePath,
            },
            error
          );
          throw error;
        }
      })
    );

    return {
      items: batches.map((batch, index) =>
        toBoardImportBatchDTO(batch, downloadUrls[index])
      ),
      nextCursor,
    };
  }
}
