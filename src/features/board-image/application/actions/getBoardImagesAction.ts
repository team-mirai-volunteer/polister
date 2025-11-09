"use server";

import { resolve } from "@/shared/lib/di";
import { TOKENS } from "@/shared/lib/di/tokens";

export interface BoardImageDTO {
  id: string;
  boardId: string | null;
  originalFilename: string;
  originalPath: string;
  displayPath: string | null;
  thumbnailPath: string | null;
  sourceUrl: string | null;
  sourceFileId: string | null;
  csvPrefecture: string | null;
  csvCity: string | null;
  csvBoardNumber: string | null;
  latitude: number | null;
  longitude: number | null;
  takenAt: string | null;
  uploadedAt: string | null;
  verificationStatus: string;
  statusNote: string | null;
  reviewNote: string | null;
  reviewComment: string | null;
  isPublic: boolean;
  createdAt: string;
}

export interface GetBoardImagesInput {
  limit?: number;
  offset?: number;
  verificationStatus?: string;
  hasBoard?: boolean;
  csvPrefecture?: string;
  csvCity?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export interface GetBoardImagesResult {
  images: BoardImageDTO[];
  total: number;
}

export async function getBoardImagesAction(
  input: GetBoardImagesInput = {}
): Promise<GetBoardImagesResult> {
  const repository = resolve(TOKENS.BoardImageRepository);

  const [images, total] = await Promise.all([
    repository.findMany({
      limit: input.limit ?? 50,
      offset: input.offset ?? 0,
      verificationStatus: input.verificationStatus,
      hasBoard: input.hasBoard,
      csvPrefecture: input.csvPrefecture,
      csvCity: input.csvCity,
      sortField: input.sortField as never,
      sortOrder: input.sortOrder,
    }),
    repository.count({
      verificationStatus: input.verificationStatus,
      hasBoard: input.hasBoard,
      csvPrefecture: input.csvPrefecture,
      csvCity: input.csvCity,
    }),
  ]);

  return {
    images: images.map(
      (image): BoardImageDTO => ({
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
      })
    ),
    total,
  };
}
