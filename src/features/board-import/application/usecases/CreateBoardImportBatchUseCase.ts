/**
 * CreateBoardImportBatchUseCase
 *
 * 自治体CSVを解析し、掲示板インポートバッチを作成する。
 */

import type { ParsedBoardImportRow } from "@/features/board-import/application/services/BoardImportCsvParser";
import { BoardImportCsvParser } from "@/features/board-import/application/services/BoardImportCsvParser";
import { BoardImportDiffer } from "@/features/board-import/application/services/BoardImportDiffer";
import type {
  BoardImportStorage,
  SaveBoardImportFileParams,
} from "@/features/board-import/application/services/BoardImportStorage";
import type { BoardImportBatch } from "@/features/board-import/domain/entities/BoardImportBatch";
import type { BoardImportMissing } from "@/features/board-import/domain/entities/BoardImportMissing";
import type { BoardImportRow } from "@/features/board-import/domain/entities/BoardImportRow";
import type {
  CreateBoardImportMissingInput,
  CreateBoardImportRowInput,
  ExistingBoardSnapshot,
  IBoardImportRepository,
  CreateBoardImportBatchInput as RepositoryBatchInput,
} from "@/features/board-import/domain/repositories/IBoardImportRepository";
import type { IMunicipalityRepository } from "@/features/municipality/domain/repositories/IMunicipalityRepository";
import type { AppLogger, DateProvider } from "@/shared/lib/di/tokens";
import { TOKENS } from "@/shared/lib/di/tokens";
import { createHash } from "crypto";
import { inject, injectable } from "tsyringe";

export interface MunicipalityReference {
  prefecture: string;
  name: string;
}

export const normalizeMunicipalityValue = (
  value: string | null | undefined
): string => {
  if (!value) {
    return "";
  }

  return value.replace(/\s+/g, "").replace(/　/g, "").toLowerCase();
};

export const filterRowsForMunicipality = (
  rows: ParsedBoardImportRow[],
  municipality: MunicipalityReference
): ParsedBoardImportRow[] => {
  const expectedPrefecture = normalizeMunicipalityValue(
    municipality.prefecture
  );
  const expectedCity = normalizeMunicipalityValue(municipality.name);

  return rows.filter((row) => {
    const rowPrefecture = normalizeMunicipalityValue(row.prefecture);
    const rowCity = normalizeMunicipalityValue(row.city);
    const rowAddress = normalizeMunicipalityValue(row.address);

    if (rowPrefecture !== expectedPrefecture) {
      return false;
    }

    if (rowCity === expectedCity) {
      return true;
    }

    if (rowCity.startsWith(expectedCity)) {
      return true;
    }

    if (expectedCity.startsWith(rowCity) && rowCity.length > 0) {
      const tail = expectedCity.slice(rowCity.length);
      if (tail.length === 0) {
        return true;
      }

      if (rowAddress.startsWith(tail)) {
        return true;
      }
    }

    return false;
  });
};

export interface CreateBoardImportBatchInput {
  municipalityId: string;
  uploaderId?: string | null;
  fileName: string;
  buffer: Buffer;
  contentType?: string;
  notes?: string | null;
}

export interface CreateBoardImportBatchResult {
  batch: BoardImportBatch;
  rows: BoardImportRow[];
  missing: BoardImportMissing[];
  matchedBoards: Map<string, ExistingBoardSnapshot>;
  downloadUrl: string | null;
}

@injectable()
export class CreateBoardImportBatchUseCase {
  private readonly parser = new BoardImportCsvParser();
  private readonly differ = new BoardImportDiffer();

  constructor(
    @inject(TOKENS.BoardImportRepository)
    private readonly repository: IBoardImportRepository,
    @inject(TOKENS.MunicipalityRepository)
    private readonly municipalityRepository: IMunicipalityRepository,
    @inject(TOKENS.BoardImportStorage)
    private readonly storage: BoardImportStorage,
    @inject(TOKENS.DateProvider)
    private readonly dateProvider: DateProvider,
    @inject(TOKENS.Logger)
    private readonly logger: AppLogger
  ) {}

  async execute(
    input: CreateBoardImportBatchInput
  ): Promise<CreateBoardImportBatchResult> {
    if (input.buffer.byteLength === 0) {
      throw new Error("空のファイルはアップロードできません。");
    }

    const municipality = await this.municipalityRepository.findById(
      input.municipalityId
    );
    if (!municipality) {
      throw new Error("指定された自治体が存在しません。");
    }

    const parsedRows = this.parser.parse(input.buffer);
    const existingBoards =
      await this.repository.findExistingBoardsByMunicipality(
        input.municipalityId
      );

    if (parsedRows.length === 0) {
      throw new Error("解析対象の行が存在しません。");
    }

    const filteredRows = filterRowsForMunicipality(parsedRows, {
      prefecture: municipality.prefecture,
      name: municipality.name,
    });

    if (filteredRows.length === 0) {
      throw new Error(
        `CSVに対象自治体（${municipality.prefecture} ${municipality.name}）の行が含まれていません。ファイル内容を確認してください。`
      );
    }

    const duplicateNumbers = new Map<string, number>();
    filteredRows.forEach((row) => {
      if (row.boardNumber === null) {
        return;
      }

      duplicateNumbers.set(
        row.boardNumber,
        (duplicateNumbers.get(row.boardNumber) ?? 0) + 1
      );
    });

    const conflicts = Array.from(duplicateNumbers.entries()).filter(
      ([, count]) => count > 1
    );
    if (conflicts.length > 0) {
      const duplicated = conflicts.map(([number]) => number).join(", ");
      throw new Error(
        `掲示板番号が重複しています: ${duplicated}。CSVを確認してください。`
      );
    }

    const diffResult = this.differ.execute(filteredRows, existingBoards);

    const unmatchedExistingCount = diffResult.missingBoards.length;
    if (unmatchedExistingCount > 0) {
      this.logger.info("[BoardImport] Missing boards detected during import", {
        municipalityId: input.municipalityId,
        missingCount: unmatchedExistingCount,
      });
    }

    const checksum = createHash("sha256").update(input.buffer).digest("hex");

    const storageParams: SaveBoardImportFileParams = {
      municipalityId: input.municipalityId,
      fileName: input.fileName,
      buffer: input.buffer,
      contentType: input.contentType,
    };

    const { storagePath } = await this.storage.saveFile(storageParams);
    let downloadUrl: string | null = null;
    try {
      downloadUrl = await this.storage.getDownloadUrl(storagePath);
    } catch (error) {
      this.logger.error("[BoardImport] Failed to resolve download URL", error);
      throw error;
    }

    const uploadedAt = this.dateProvider.now();

    const batchInput: RepositoryBatchInput = {
      municipalityId: input.municipalityId,
      sourceFileName: input.fileName,
      storagePath,
      fileSize: input.buffer.byteLength,
      checksum,
      totalRows: filteredRows.length,
      matchedCount: diffResult.stats.matchedCount,
      updatedCount: diffResult.stats.updatedCount,
      newCount: diffResult.stats.newCount,
      missingCount: diffResult.stats.missingCount,
      duplicateCount: diffResult.stats.duplicateCount,
      uploadedBy: input.uploaderId ?? null,
      uploadedAt,
      notes: input.notes ?? null,
    };

    const rowsInput: CreateBoardImportRowInput[] = diffResult.rows.map(
      (row) => ({
        prefecture: row.parsed.prefecture,
        city: row.parsed.city,
        boardNumber: row.parsed.boardNumber,
        address: row.parsed.address,
        name: row.parsed.name,
        latitude: row.parsed.latitude,
        longitude: row.parsed.longitude,
        note: row.parsed.note,
        rawData: row.parsed.raw,
        matchedBoardId: row.matchedBoard?.id ?? null,
        matchConfidence: row.matchConfidence,
        distanceMeter: row.distanceMeter,
        diff: row.diff,
        suggestedAction: row.suggestedAction,
        finalDecision: row.finalDecision,
        assigneeId: null,
        comment: null,
      })
    );

    const missingInput: CreateBoardImportMissingInput[] =
      diffResult.missingBoards.map((board) => ({
        boardId: board.id,
        reason: "NOT_IN_SOURCE",
        finalDecision: null,
        comment: null,
      }));

    const { batch, rows, missing } =
      await this.repository.createBatchWithDetails({
        batch: batchInput,
        rows: rowsInput,
        missing: missingInput,
      });

    const matchedBoards = new Map<string, ExistingBoardSnapshot>();
    diffResult.rows.forEach((row) => {
      if (row.matchedBoard) {
        matchedBoards.set(row.matchedBoard.id, row.matchedBoard);
      }
    });

    return {
      batch,
      rows,
      missing,
      matchedBoards,
      downloadUrl,
    };
  }
}
