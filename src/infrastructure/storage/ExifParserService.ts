import type { AppLogger } from "@/shared/lib/di/tokens";
import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";

// Lazy load exifr to avoid loading in E2E tests
let exifr: typeof import("exifr") | null = null;
const getExifr = async () => {
  if (!exifr) {
    exifr = await import("exifr");
  }
  return exifr;
};

export interface ExifGPSData {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  timestamp: Date | null;
}

/**
 * Exif解析サービス
 * 画像ファイルからGPS情報を抽出
 */
@injectable()
export class ExifParserService {
  constructor(@inject(TOKENS.Logger) private readonly logger: AppLogger) {}

  /**
   * 画像バッファからGPS情報を抽出
   * @param imageBuffer 画像バッファ
   * @returns GPS情報
   */
  async extractGPS(imageBuffer: Buffer): Promise<ExifGPSData> {
    try {
      const exifrLib = await getExifr();
      const exif = await exifrLib.parse(imageBuffer, {
        gps: true,
        pick: ["latitude", "longitude", "GPSAltitude", "DateTimeOriginal"],
      });

      if (!exif) {
        return {
          latitude: null,
          longitude: null,
          altitude: null,
          timestamp: null,
        };
      }

      return {
        latitude: exif.latitude ?? null,
        longitude: exif.longitude ?? null,
        altitude: exif.GPSAltitude ?? null,
        timestamp: exif.DateTimeOriginal
          ? new Date(exif.DateTimeOriginal)
          : null,
      };
    } catch (error) {
      this.logger.warn("Exif解析失敗:", error);
      return {
        latitude: null,
        longitude: null,
        altitude: null,
        timestamp: null,
      };
    }
  }

  /**
   * 複数画像から一括でGPS情報を抽出
   */
  async extractGPSBatch(imageBuffers: Buffer[]): Promise<ExifGPSData[]> {
    return await Promise.all(
      imageBuffers.map((buffer) => this.extractGPS(buffer))
    );
  }
}
