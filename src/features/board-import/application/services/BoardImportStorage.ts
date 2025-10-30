export interface SaveBoardImportFileParams {
  municipalityId: string;
  fileName: string;
  buffer: Buffer;
  contentType?: string;
}

export interface SaveBoardImportFileResult {
  storagePath: string;
}

export interface BoardImportStorage {
  saveFile(
    params: SaveBoardImportFileParams
  ): Promise<SaveBoardImportFileResult>;
  getDownloadUrl(storagePath: string): Promise<string | null>;
}
