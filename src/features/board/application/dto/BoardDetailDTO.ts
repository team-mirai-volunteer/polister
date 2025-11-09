/**
 * 掲示板詳細 DTO
 */

import type { Board } from "@/features/board/domain/aggregates/Board";
import type { BoardHistory } from "@/features/board/domain/entities/BoardHistory";

export interface BoardDetailDTO {
  id: string;
  boardNumber: string | null;
  name: string | null;
  address: string;
  latitude: number;
  longitude: number;
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
}

export const mapBoardToDTO = (board: Board): BoardDetailDTO => ({
  id: board.id,
  boardNumber: board.boardNumber,
  name: board.name,
  address: board.address.value,
  latitude: board.coordinates.latitude,
  longitude: board.coordinates.longitude,
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
