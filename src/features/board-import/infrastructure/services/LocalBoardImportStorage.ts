import {
  BoardImportStorage,
  SaveBoardImportFileParams,
  SaveBoardImportFileResult,
} from "@/features/board-import/application/services/BoardImportStorage";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import { injectable } from "tsyringe";

const sanitizeFileName = (fileName: string): string =>
  fileName.replace(/[^a-zA-Z0-9_.-]+/g, "_");

@injectable()
export class LocalBoardImportStorage implements BoardImportStorage {
  private readonly baseDir: string;

  constructor() {
    const configured = process.env.BOARD_IMPORT_STORAGE_DIR;
    this.baseDir = configured
      ? path.resolve(configured)
      : path.resolve(process.cwd(), "storage", "board-imports");
  }

  async saveFile(
    params: SaveBoardImportFileParams
  ): Promise<SaveBoardImportFileResult> {
    const identifier = randomUUID();
    const safeFileName = sanitizeFileName(params.fileName);
    const storagePath = path.join(
      params.municipalityId,
      identifier,
      safeFileName
    );
    const absolutePath = path.join(this.baseDir, storagePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, params.buffer);

    return { storagePath };
  }

  async getDownloadUrl(storagePath: string): Promise<string | null> {
    void storagePath;
    // TODO(#76): Provide an HTTP-accessible download endpoint when storage仕様が確定したら差し替え
    return null;
  }
}
