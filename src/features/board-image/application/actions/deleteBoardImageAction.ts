"use server";

import "reflect-metadata";

import { resolve } from "@/shared/lib/di";
import { TOKENS } from "@/shared/lib/di/tokens";

interface DeleteBoardImageResult {
  success: boolean;
  error?: string;
}

export async function deleteBoardImageAction(
  id: string
): Promise<DeleteBoardImageResult> {
  const repository = resolve(TOKENS.BoardImageRepository);
  const storageService = resolve(TOKENS.StorageService);

  const image = await repository.findById(id);
  if (!image) {
    return { success: false, error: "not_found" };
  }

  const filePaths = [
    image.originalPath,
    image.displayPath ?? undefined,
    image.thumbnailPath ?? undefined,
  ].filter((path): path is string => Boolean(path));

  await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        await storageService.delete(filePath);
      } catch (error) {
        console.warn("画像ファイル削除失敗", filePath, error);
      }
    })
  );

  await repository.delete(id);

  return { success: true };
}
