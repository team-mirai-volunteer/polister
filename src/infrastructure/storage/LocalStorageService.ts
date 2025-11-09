import { promises as fs } from "fs";
import * as path from "path";
import { injectable } from "tsyringe";
import type { IStorageService } from "./IStorageService";

/**
 * ローカルストレージサービス（開発環境用）
 * tmp/storage/ 配下にファイルを保存
 */
@injectable()
export class LocalStorageService implements IStorageService {
  private readonly baseDir = path.join(process.cwd(), "tmp", "storage");

  async save(file: Buffer, relativePath: string): Promise<string> {
    const fullPath = path.join(this.baseDir, relativePath);
    const dir = path.dirname(fullPath);

    // ディレクトリが存在しない場合は作成
    await fs.mkdir(dir, { recursive: true });

    // ファイルを保存
    await fs.writeFile(fullPath, file);

    return relativePath;
  }

  async get(relativePath: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, relativePath);
    return await fs.readFile(fullPath);
  }

  async delete(relativePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, relativePath);
    await fs.unlink(fullPath);
  }

  async getPublicUrl(relativePath: string): Promise<string> {
    // /api/images/ 経由で配信（認証付き）
    return `/api/images/${relativePath}`;
  }

  async exists(relativePath: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, relativePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
