import type { AppLogger } from "@/shared/lib/di/tokens";
import { TOKENS } from "@/shared/lib/di/tokens";
import axios from "axios";
import { promises as fs } from "fs";
import * as path from "path";
import { inject, injectable } from "tsyringe";

export interface DownloadResult {
  success: boolean;
  buffer?: Buffer;
  error?: string;
  cached?: boolean;
}

/**
 * Google Drive ダウンロードサービス
 * 認証不要の直接ダウンロード方式を使用
 * tmp/download-cache/ にキャッシュして再ダウンロードを防ぐ
 */
@injectable()
export class GoogleDriveDownloadService {
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1秒
  private readonly cacheDir = path.join(process.cwd(), "tmp", "download-cache");

  constructor(@inject(TOKENS.Logger) private readonly logger: AppLogger) {}

  /**
   * Google DriveのファイルIDから画像をダウンロード
   * キャッシュがあればキャッシュから返す
   * @param fileId Google Drive File ID
   * @returns ダウンロード結果
   */
  async download(fileId: string): Promise<DownloadResult> {
    // キャッシュチェック
    const cacheFilePath = path.join(this.cacheDir, fileId);

    try {
      await fs.access(cacheFilePath);
      // キャッシュが存在する
      const buffer = await fs.readFile(cacheFilePath);
      this.logger.debug(
        `キャッシュから読み込み: ${fileId} (${buffer.length} bytes)`
      );
      return {
        success: true,
        buffer,
        cached: true,
      };
    } catch {
      // キャッシュなし、ダウンロード
    }

    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.debug(
          `ダウンロード試行 ${attempt}/${this.maxRetries}: ${fileId}`
        );

        const response = await axios.get(downloadUrl, {
          responseType: "arraybuffer",
          timeout: 30000, // 30秒
          maxRedirects: 5,
          validateStatus: (status) => status === 200,
        });

        const buffer = Buffer.from(response.data);

        // キャッシュに保存
        await fs.mkdir(this.cacheDir, { recursive: true });
        await fs.writeFile(cacheFilePath, buffer);

        this.logger.debug(
          `ダウンロード成功（キャッシュ保存済み）: ${fileId} (${buffer.length} bytes)`
        );

        return {
          success: true,
          buffer,
          cached: false,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `ダウンロード失敗 (試行 ${attempt}/${this.maxRetries}): ${fileId} - ${errorMessage}`
        );

        // 最後の試行でない場合は待機してリトライ
        if (attempt < this.maxRetries) {
          await this.sleep(this.retryDelay * attempt); // exponential backoff
        } else {
          return {
            success: false,
            error: errorMessage,
            cached: false,
          };
        }
      }
    }

    return {
      success: false,
      error: "最大リトライ回数を超えました",
      cached: false,
    };
  }

  /**
   * 複数ファイルを並列ダウンロード
   * @param fileIds File IDの配列
   * @param batchSize 並列実行数（デフォルト: 10）
   * @param onProgress 進捗コールバック
   */
  async downloadBatch(
    fileIds: string[],
    batchSize = 10,
    onProgress?: (completed: number, total: number) => void
  ): Promise<Map<string, DownloadResult>> {
    const results = new Map<string, DownloadResult>();
    let completed = 0;

    // バッチ単位で並列ダウンロード
    for (let i = 0; i < fileIds.length; i += batchSize) {
      const batch = fileIds.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (fileId) => {
          const result = await this.download(fileId);
          completed++;
          onProgress?.(completed, fileIds.length);
          return { fileId, result };
        })
      );

      batchResults.forEach(({ fileId, result }) => {
        results.set(fileId, result);
      });
    }

    return results;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
