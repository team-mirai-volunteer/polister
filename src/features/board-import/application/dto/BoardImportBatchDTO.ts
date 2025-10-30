import type { BoardImportRowDiff } from "@/features/board-import/domain/entities/BoardImportRow";
import type {
  BoardImportMatchConfidence,
  BoardImportMissingDecision,
  BoardImportRowDecision,
  BoardImportStatus,
  BoardImportSuggestedAction,
} from "@/features/board-import/domain/types/BoardImportTypes";

export interface BoardImportBatchDTO {
  id: string;
  municipalityId: string;
  status: BoardImportStatus;
  sourceFileName: string;
  fileSize: number;
  checksum: string;
  storagePath: string;
  downloadUrl: string | null;
  totalRows: number;
  matchedCount: number;
  updatedCount: number;
  newCount: number;
  missingCount: number;
  duplicateCount: number;
  uploadedBy: string | null;
  uploadedAt: string;
  confirmedBy: string | null;
  confirmedAt: string | null;
  notes: string | null;
}

export interface BoardImportMatchedBoardDTO {
  id: string;
  boardNumber: number | null;
  name: string | null;
  address: string;
  note: string | null;
  status: string;
  trustLevel: string;
  longitude: number | null;
  latitude: number | null;
}

export interface BoardImportRowDTO {
  id: string;
  batchId: string;
  prefecture: string;
  city: string;
  boardNumber: number | null;
  address: string;
  name: string | null;
  latitude: number;
  longitude: number;
  note: string | null;
  matchConfidence: BoardImportMatchConfidence;
  matchedBoard: BoardImportMatchedBoardDTO | null;
  distanceMeter: number | null;
  diff: BoardImportRowDiff | null;
  suggestedAction: BoardImportSuggestedAction;
  finalDecision: BoardImportRowDecision | null;
  assigneeId: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardImportMissingDTO {
  id: string;
  batchId: string;
  boardId: string;
  reason: string;
  finalDecision: BoardImportMissingDecision | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}
