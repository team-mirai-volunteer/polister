"use server";

import { resolve } from "@/shared/lib/di";
import { TOKENS } from "@/shared/lib/di/tokens";
import type { BoardImageDTO } from "./getBoardImagesAction";

export async function getBoardImageByIdAction(
  id: string
): Promise<BoardImageDTO | null> {
  const repository = resolve(TOKENS.BoardImageRepository);

  const image = await repository.findById(id);
  if (!image) return null;

  return {
    id: image.id,
    boardId: image.boardId,
    originalFilename: image.originalFilename,
    originalPath: image.originalPath,
    displayPath: image.displayPath,
    thumbnailPath: image.thumbnailPath,
    sourceUrl: image.sourceUrl,
    sourceFileId: image.sourceFileId,
    csvPrefecture: image.csvPrefecture,
    csvCity: image.csvCity,
    csvBoardNumber: image.csvBoardNumber,
    latitude: image.latitude,
    longitude: image.longitude,
    takenAt: image.takenAt?.toISOString() ?? null,
    uploadedAt: image.uploadedAt?.toISOString() ?? null,
    verificationStatus: image.verificationStatus,
    statusNote: image.statusNote,
    reviewNote: image.reviewNote,
    reviewComment: image.reviewComment,
    isPublic: image.isPublic,
    createdAt: image.createdAt.toISOString(),
  };
}
