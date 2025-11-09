import { Storage } from "@google-cloud/storage";
import { injectable } from "tsyringe";
import type { IStorageService } from "./IStorageService";

/**
 * Google Cloud Storageサービス（本番環境用）
 */
@injectable()
export class CloudStorageService implements IStorageService {
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly signedUrlExpiration = 3600000; // 1時間（ミリ秒）

  constructor() {
    // 環境変数からバケット名を取得
    this.bucketName = process.env.GCS_BUCKET_NAME || "polister-board-images";

    // Google Cloud Storage クライアント初期化
    // 本番環境ではApplication Default Credentials（ADC）を使用
    // 開発環境では GOOGLE_APPLICATION_CREDENTIALS 環境変数でサービスアカウントキーを指定
    this.storage = new Storage();
  }

  async save(file: Buffer, relativePath: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(relativePath);

    // ファイルをアップロード
    await blob.save(file, {
      metadata: {
        contentType: this.getContentType(relativePath),
        cacheControl: "public, max-age=31536000", // 1年間キャッシュ
      },
    });

    return relativePath;
  }

  async get(relativePath: string): Promise<Buffer> {
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(relativePath);

    const [contents] = await blob.download();
    return contents;
  }

  async delete(relativePath: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(relativePath);

    await blob.delete();
  }

  async getPublicUrl(relativePath: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(relativePath);

    // 署名付きURL生成（有効期限: 1時間）
    const [url] = await blob.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + this.signedUrlExpiration,
    });

    return url;
  }

  async exists(relativePath: string): Promise<boolean> {
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(relativePath);

    const [exists] = await blob.exists();
    return exists;
  }

  /**
   * ファイル拡張子からContent-Typeを推測
   */
  private getContentType(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      pdf: "application/pdf",
    };

    return mimeTypes[ext || ""] || "application/octet-stream";
  }
}
