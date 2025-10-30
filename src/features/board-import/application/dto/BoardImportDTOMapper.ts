import type {
  BoardImportBatchDTO,
  BoardImportMissingDTO,
  BoardImportRowDTO,
} from "@/features/board-import/application/dto/BoardImportBatchDTO";
import type { BoardImportBatch } from "@/features/board-import/domain/entities/BoardImportBatch";
import type { BoardImportMissing } from "@/features/board-import/domain/entities/BoardImportMissing";
import type { BoardImportRow } from "@/features/board-import/domain/entities/BoardImportRow";
import type { ExistingBoardSnapshot } from "@/features/board-import/domain/repositories/IBoardImportRepository";

export const toBoardImportBatchDTO = (
  batch: BoardImportBatch,
  downloadUrl: string | null
): BoardImportBatchDTO => ({
  id: batch.id,
  municipalityId: batch.municipalityId,
  status: batch.status,
  sourceFileName: batch.sourceFileName,
  fileSize: batch.fileSize,
  checksum: batch.checksum,
  storagePath: batch.storagePath,
  downloadUrl,
  totalRows: batch.totalRows,
  matchedCount: batch.matchedCount,
  updatedCount: batch.updatedCount,
  newCount: batch.newCount,
  missingCount: batch.missingCount,
  duplicateCount: batch.duplicateCount,
  uploadedBy: batch.uploadedBy,
  uploadedAt: batch.uploadedAt.toISOString(),
  confirmedBy: batch.confirmedBy ?? null,
  confirmedAt: batch.confirmedAt?.toISOString() ?? null,
  notes: batch.notes ?? null,
});

export const toBoardImportRowDTO = (
  row: BoardImportRow,
  matchedSnapshot: ExistingBoardSnapshot | undefined
): BoardImportRowDTO => ({
  id: row.id,
  batchId: row.batchId,
  prefecture: row.prefecture,
  city: row.city,
  boardNumber: row.boardNumber,
  address: row.address,
  name: row.name,
  latitude: row.latitude,
  longitude: row.longitude,
  note: row.note,
  matchConfidence: row.matchConfidence,
  matchedBoard: matchedSnapshot
    ? {
        id: matchedSnapshot.id,
        boardNumber: matchedSnapshot.boardNumber,
        name: matchedSnapshot.name,
        address: matchedSnapshot.address,
        note: matchedSnapshot.note,
        status: matchedSnapshot.status,
        trustLevel: matchedSnapshot.trustLevel,
        longitude: matchedSnapshot.longitude,
        latitude: matchedSnapshot.latitude,
      }
    : null,
  distanceMeter: row.distanceMeter,
  diff: row.diff,
  suggestedAction: row.suggestedAction,
  finalDecision: row.finalDecision,
  assigneeId: row.assigneeId,
  comment: row.comment,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const toBoardImportMissingDTO = (
  missing: BoardImportMissing
): BoardImportMissingDTO => ({
  id: missing.id,
  batchId: missing.batchId,
  boardId: missing.boardId,
  reason: missing.reason,
  finalDecision: missing.finalDecision,
  comment: missing.comment,
  createdAt: missing.createdAt.toISOString(),
  updatedAt: missing.updatedAt.toISOString(),
});
