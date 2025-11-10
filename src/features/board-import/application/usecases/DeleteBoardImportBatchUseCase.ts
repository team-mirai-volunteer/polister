import { BoardImportBatchNotFoundError } from "@/features/board-import/application/usecases/GetBoardImportBatchDetailUseCase";
import type { IBoardImportRepository } from "@/features/board-import/domain/repositories/IBoardImportRepository";
import type { IStorageService } from "@/infrastructure/storage/IStorageService";
import type { AppLogger } from "@/shared/lib/di/tokens";
import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";

export interface DeleteBoardImportBatchInput {
  batchId: string;
}

@injectable()
export class DeleteBoardImportBatchUseCase {
  constructor(
    @inject(TOKENS.BoardImportRepository)
    private readonly repository: IBoardImportRepository,
    @inject(TOKENS.StorageService)
    private readonly storage: IStorageService,
    @inject(TOKENS.Logger)
    private readonly logger: AppLogger
  ) {}

  async execute(input: DeleteBoardImportBatchInput): Promise<void> {
    const batch = await this.repository.findBatchById(input.batchId);
    if (!batch) {
      throw new BoardImportBatchNotFoundError(input.batchId);
    }

    await Promise.all([
      this.deleteStorageFile(batch.storagePath),
      this.repository.deleteBatch(batch.id),
    ]);
  }

  private async deleteStorageFile(path: string): Promise<void> {
    try {
      await this.storage.delete(path);
    } catch (error) {
      this.logger.warn("[BoardImport] Failed to delete storage file", error);
    }
  }
}
