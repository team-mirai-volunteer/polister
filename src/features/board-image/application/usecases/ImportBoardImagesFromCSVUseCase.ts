import type { ExifParserService } from "@/infrastructure/storage/ExifParserService";
import type { GoogleDriveDownloadService } from "@/infrastructure/storage/GoogleDriveDownloadService";
import type { ImageResizeService } from "@/infrastructure/storage/ImageResizeService";
import type { IStorageService } from "@/infrastructure/storage/IStorageService";
import type { AppLogger } from "@/shared/lib/di/tokens";
import { TOKENS } from "@/shared/lib/di/tokens";
import { parse } from "csv-parse/sync";
import { promises as fs } from "fs";
import * as path from "path";
import { inject, injectable } from "tsyringe";
import type {
  CreateBoardImageInput,
  IBoardImageRepository,
} from "../../domain/repositories/IBoardImageRepository";

interface CSVRow {
  Timestamp: string;
  Prefecture: string;
  City: string;
  Ward: string;
  Number: string;
  Status: string;
  Note: string;
  Comment: string;
  Filename: string;
  "File URL": string;
  "File ID": string;
  Latitude: string;
  Longitude: string;
  TakenAt: string;
}

export interface ImportBoardImagesResult {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  downloadedCount: number;
  errors: Array<{ row: number; fileId: string; error: string }>;
}

/**
 * CSVから掲示板画像をインポートするユースケース
 * Google Driveから画像をダウンロードし、3種類にリサイズして保存
 */
@injectable()
export class ImportBoardImagesFromCSVUseCase {
  constructor(
    @inject(TOKENS.BoardImageRepository)
    private readonly boardImageRepository: IBoardImageRepository,
    @inject(TOKENS.StorageService)
    private readonly storageService: IStorageService,
    @inject(TOKENS.GoogleDriveDownloadService)
    private readonly downloadService: GoogleDriveDownloadService,
    @inject(TOKENS.ImageResizeService)
    private readonly resizeService: ImageResizeService,
    @inject(TOKENS.ExifParserService)
    private readonly exifParser: ExifParserService,
    @inject(TOKENS.Logger)
    private readonly logger: AppLogger
  ) {}

  async execute(
    csvFilePath: string,
    options?: {
      limit?: number;
      skipDownload?: boolean;
      batchSize?: number;
    }
  ): Promise<ImportBoardImagesResult> {
    this.logger.info(`CSVインポート開始: ${csvFilePath}`);

    // CSVファイル読み込み
    const fileContent = await fs.readFile(csvFilePath, "utf-8");

    // CSVパース
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CSVRow[];

    this.logger.info(`CSVレコード数: ${records.length}`);

    const limit = options?.limit ?? records.length;
    const targetRecords = records.slice(0, limit);
    const skipDownload = options?.skipDownload ?? false;
    const batchSize = options?.batchSize ?? 10;

    const result: ImportBoardImagesResult = {
      totalRows: targetRecords.length,
      importedCount: 0,
      skippedCount: 0,
      downloadedCount: 0,
      errors: [],
    };

    // 処理対象のレコードを準備
    const processTargets: Array<{
      row: CSVRow;
      rowNumber: number;
    }> = [];

    for (let i = 0; i < targetRecords.length; i++) {
      const row = targetRecords[i];
      const rowNumber = i + 1;

      // バリデーション
      if (!row.Filename || !row["File ID"]) {
        result.skippedCount++;
        result.errors.push({
          row: rowNumber,
          fileId: row["File ID"] || "",
          error: "Filename または File ID が空です",
        });
        continue;
      }

      processTargets.push({ row, rowNumber });
    }

    // バッチ処理でダウンロード・リサイズ・保存・DB登録
    for (let i = 0; i < processTargets.length; i += batchSize) {
      const batch = processTargets.slice(i, i + batchSize);

      this.logger.info(
        `バッチ処理中: ${i + 1}-${Math.min(i + batchSize, processTargets.length)}/${processTargets.length}`
      );

      await Promise.all(
        batch.map(({ row, rowNumber }) =>
          this.processRow(row, rowNumber, skipDownload, result)
        )
      );
    }

    this.logger.info(
      `CSVインポート完了: 総数=${result.totalRows}, 成功=${result.importedCount}, ダウンロード=${result.downloadedCount}, スキップ=${result.skippedCount}, エラー=${result.errors.length}`
    );

    return result;
  }

  private async processRow(
    row: CSVRow,
    rowNumber: number,
    skipDownload: boolean,
    result: ImportBoardImagesResult
  ): Promise<void> {
    try {
      const fileId = row["File ID"];
      const prefecture = row.Prefecture || "unknown";
      const city = row.City || "unknown";
      const filename = row.Filename;
      const filenameWithoutExt = path.parse(filename).name;

      // パス生成
      const basePath = `board-images/${prefecture}/${city}`;
      const originalPath = `${basePath}/original/${filename}`;
      // Display and thumbnail are always JPEG encoded, so use .jpg extension
      const displayPath = `${basePath}/display/${filenameWithoutExt}_display.jpg`;
      const thumbnailPath = `${basePath}/thumbnail/${filenameWithoutExt}_thumb.jpg`;

      let actualDisplayPath: string | null = null;
      let actualThumbnailPath: string | null = null;
      let exifLatitude: number | null = null;
      let exifLongitude: number | null = null;
      let exifTakenAt: Date | null = null;

      // ダウンロード・リサイズ・保存
      if (!skipDownload) {
        const downloadResult = await this.downloadService.download(fileId);

        if (downloadResult.success && downloadResult.buffer) {
          result.downloadedCount++;

          // Exifから位置情報を抽出（CSVより優先）
          const exifGPS = await this.exifParser.extractGPS(
            downloadResult.buffer
          );
          exifLatitude = exifGPS.latitude;
          exifLongitude = exifGPS.longitude;
          exifTakenAt = exifGPS.timestamp;

          // 3種類にリサイズ
          const resized = await this.resizeService.resizeImage(
            downloadResult.buffer
          );

          // オリジナルを保存
          await this.storageService.save(resized.original, originalPath);

          // UI表示用を保存
          await this.storageService.save(resized.display, displayPath);
          actualDisplayPath = displayPath;

          // サムネイルを保存
          await this.storageService.save(resized.thumbnail, thumbnailPath);
          actualThumbnailPath = thumbnailPath;

          this.logger.debug(`画像保存完了: ${filename}`);
        } else {
          // ダウンロード失敗
          this.logger.warn(
            `ダウンロード失敗: ${fileId} - ${downloadResult.error}`
          );
          // ダウンロード失敗でもメタデータは登録
        }
      }

      // DB登録用データ作成
      const uploadedAt = this.parseTimestamp(row.Timestamp);
      const csvTakenAt = row.TakenAt ? new Date(row.TakenAt) : null;
      const csvLatitude = row.Latitude ? parseFloat(row.Latitude) : null;
      const csvLongitude = row.Longitude ? parseFloat(row.Longitude) : null;

      // Exifの位置情報を優先、なければCSVの値を使用
      const latitude = exifLatitude ?? csvLatitude;
      const longitude = exifLongitude ?? csvLongitude;
      const takenAt = exifTakenAt ?? csvTakenAt;

      const input: CreateBoardImageInput = {
        originalFilename: filename,
        originalPath,
        displayPath: actualDisplayPath ?? undefined,
        thumbnailPath: actualThumbnailPath ?? undefined,
        sourceUrl: row["File URL"] || undefined,
        sourceFileId: fileId,
        csvPrefecture: row.Prefecture || undefined,
        csvCity: row.City || undefined,
        csvBoardNumber: row.Number || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        takenAt: takenAt ?? undefined,
        uploadedAt: uploadedAt ?? undefined,
        statusNote: row.Status || undefined,
        reviewNote: row.Note || undefined,
        reviewComment: row.Comment || undefined,
        verificationStatus: skipDownload
          ? this.determineVerificationStatus(row.Status)
          : actualDisplayPath
            ? this.determineVerificationStatus(row.Status)
            : "DOWNLOAD_FAILED",
      };

      // DB登録
      await this.boardImageRepository.create(input);
      result.importedCount++;
    } catch (error) {
      result.errors.push({
        row: rowNumber,
        fileId: row["File ID"] || "",
        error: error instanceof Error ? error.message : String(error),
      });
      this.logger.error(`行${rowNumber}の処理失敗:`, error);
    }
  }

  /**
   * Timestampをパース
   * フォーマット: "17/08/2025 07:36:43" → Date
   */
  private parseTimestamp(timestamp: string): Date | null {
    if (!timestamp) return null;

    try {
      // DD/MM/YYYY HH:MM:SS 形式をパース
      const [datePart, timePart] = timestamp.split(" ");
      const [day, month, year] = datePart.split("/");
      const [hour, minute, second] = timePart.split(":");

      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
      );
    } catch {
      return null;
    }
  }

  /**
   * Status文字列から検証ステータスを判定
   */
  private determineVerificationStatus(status: string): string {
    if (!status) return "PENDING";

    const lowerStatus = status.toLowerCase();

    if (lowerStatus.includes("番号なし")) return "NO_NUMBER";
    if (lowerStatus.includes("番号読めず")) return "NO_NUMBER";
    if (lowerStatus.includes("対象外")) return "REJECTED";
    if (lowerStatus.includes("重複")) return "DUPLICATE";
    if (lowerStatus.includes("緯度経度怪しめ")) return "LOCATION_ISSUE";

    return "PENDING";
  }
}
