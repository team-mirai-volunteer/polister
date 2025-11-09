import { injectable } from "tsyringe";

// Lazy load sharp to avoid loading native modules in E2E tests
let sharp: typeof import("sharp") | null = null;
const getSharp = async () => {
  if (!sharp) {
    sharp = (await import("sharp")).default;
  }
  return sharp;
};

export interface ResizedImages {
  original: Buffer;
  display: Buffer;
  thumbnail: Buffer;
}

export interface ImageDimensions {
  displayMaxWidth: number;
  displayMaxHeight: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

const DEFAULT_DIMENSIONS: ImageDimensions = {
  displayMaxWidth: 1920, // UI表示用（フルHD相当）
  displayMaxHeight: 1080,
  thumbnailWidth: 300, // サムネイル
  thumbnailHeight: 300,
};

/**
 * 画像リサイズサービス
 * オリジナル、UI表示用、サムネイルの3種類を生成
 */
@injectable()
export class ImageResizeService {
  /**
   * 画像を3種類にリサイズ
   * @param imageBuffer オリジナル画像バッファ
   * @param dimensions リサイズ寸法（オプション）
   * @returns リサイズされた3種類の画像
   */
  async resizeImage(
    imageBuffer: Buffer,
    dimensions: ImageDimensions = DEFAULT_DIMENSIONS
  ): Promise<ResizedImages> {
    const sharpLib = await getSharp();

    // オリジナルはそのまま保持
    const original = imageBuffer;

    // UI表示用（最大サイズ制限、アスペクト比維持）
    const display = await sharpLib(imageBuffer)
      .rotate() // Exif Orientationを自動適用
      .resize(dimensions.displayMaxWidth, dimensions.displayMaxHeight, {
        fit: "inside",
        withoutEnlargement: true, // 元画像より大きくしない
      })
      .jpeg({ quality: 85 }) // JPEG品質85%
      .toBuffer();

    // サムネイル（正方形、中央クロップ）
    const thumbnail = await sharpLib(imageBuffer)
      .rotate() // Exif Orientationを自動適用
      .resize(dimensions.thumbnailWidth, dimensions.thumbnailHeight, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80 }) // JPEG品質80%
      .toBuffer();

    return {
      original,
      display,
      thumbnail,
    };
  }

  /**
   * 画像のメタデータを取得
   */
  async getMetadata(imageBuffer: Buffer) {
    const sharpLib = await getSharp();
    return await sharpLib(imageBuffer).metadata();
  }
}
