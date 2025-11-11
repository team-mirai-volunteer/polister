/**
 * 掲示場詳細 DTO
 */

import type { BoardImage } from "@/features/board-image/domain/entities/BoardImage";
import type { Board } from "@/features/board/domain/aggregates/Board";
import type { BoardHistory } from "@/features/board/domain/entities/BoardHistory";

export interface BoardDetailDTO {
  id: string;
  boardNumber: string | null;
  name: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  municipalityId: string;
  trustLevel: string;
  status: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardHistoryDTO {
  id: string;
  changeReason: string;
  userId: string | null;
  comment: string | null;
  changedAt: string;
  changes: Array<{
    field: string;
    before: unknown;
    after: unknown;
  }>;
}

export interface GetBoardDetailResponseDTO {
  board: BoardDetailDTO;
  histories: BoardHistoryDTO[];
  images: BoardRelatedImageDTO[];
}

export interface BoardRelatedImageDTO {
  id: string;
  originalFilename: string;
  originalPath: string;
  displayPath: string | null;
  thumbnailPath: string | null;
  latitude: number | null;
  longitude: number | null;
  takenAt: string | null;
  verificationStatus: string;
  statusNote: string | null;
  createdAt: string;
}

export const mapBoardToDTO = (board: Board): BoardDetailDTO => ({
  id: board.id,
  boardNumber: board.boardNumber,
  name: board.name,
  address: board.address.value,
  latitude: board.coordinates?.latitude ?? null,
  longitude: board.coordinates?.longitude ?? null,
  municipalityId: board.municipalityId,
  trustLevel: board.trustLevel,
  status: board.status,
  note: board.note,
  createdAt: board.createdAt.toISOString(),
  updatedAt: board.updatedAt.toISOString(),
});

export const mapBoardHistoryToDTO = (
  history: BoardHistory
): BoardHistoryDTO => ({
  id: history.id,
  changeReason: history.changeReason,
  userId: history.userId,
  comment: history.comment,
  changedAt: history.changedAt.toISOString(),
  changes: history.getDiff().changes,
});

export const mapBoardImageToRelatedDTO = (
  image: BoardImage
): BoardRelatedImageDTO => ({
  id: image.id,
  originalFilename: image.originalFilename,
  originalPath: image.originalPath,
  displayPath: image.displayPath,
  thumbnailPath: image.thumbnailPath,
  latitude: image.latitude,
  longitude: image.longitude,
  takenAt: image.takenAt?.toISOString() ?? null,
  verificationStatus: image.verificationStatus,
  statusNote: image.statusNote,
  createdAt: image.createdAt.toISOString(),
});
