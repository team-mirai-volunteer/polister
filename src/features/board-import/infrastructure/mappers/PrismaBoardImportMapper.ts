import type {
  BoardImportBatch,
  BoardImportBatchProps,
} from "@/features/board-import/domain/entities/BoardImportBatch";
import type { BoardImportMissingProps } from "@/features/board-import/domain/entities/BoardImportMissing";
import { BoardImportMissing } from "@/features/board-import/domain/entities/BoardImportMissing";
import type { BoardImportRowProps } from "@/features/board-import/domain/entities/BoardImportRow";
import { BoardImportRow } from "@/features/board-import/domain/entities/BoardImportRow";
import type {
  BoardImportBatch as PrismaBoardImportBatch,
  BoardImportMissing as PrismaBoardImportMissing,
  BoardImportRow as PrismaBoardImportRow,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

import { BoardImportBatch as BoardImportBatchEntity } from "@/features/board-import/domain/entities/BoardImportBatch";

const decimalToNumber = (value: Decimal | number | null): number | null => {
  if (value === null) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  return value.toNumber();
};

export const toDomainBatch = (
  record: PrismaBoardImportBatch
): BoardImportBatch => {
  const props: BoardImportBatchProps = {
    id: record.id,
    municipalityId: record.municipalityId,
    status: record.status,
    sourceFileName: record.sourceFileName,
    storagePath: record.storagePath,
    fileSize: record.fileSize,
    checksum: record.checksum,
    totalRows: record.totalRows,
    matchedCount: record.matchedCount,
    newCount: record.newCount,
    missingCount: record.missingCount,
    updatedCount: record.updatedCount,
    duplicateCount: record.duplicateCount,
    uploadedBy: record.uploadedBy,
    uploadedAt: record.uploadedAt,
    confirmedBy: record.confirmedBy,
    confirmedAt: record.confirmedAt,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };

  return new BoardImportBatchEntity(props);
};

export const toDomainRow = (record: PrismaBoardImportRow): BoardImportRow => {
  const latitude = decimalToNumber(record.latitude);
  const longitude = decimalToNumber(record.longitude);

  if (latitude === null) {
    throw new Error(`BoardImportRow latitude is null for record ${record.id}`);
  }

  if (longitude === null) {
    throw new Error(`BoardImportRow longitude is null for record ${record.id}`);
  }

  const props: BoardImportRowProps = {
    id: record.id,
    batchId: record.batchId,
    prefecture: record.prefecture,
    city: record.city,
    boardNumber: record.boardNumber,
    address: record.address,
    name: record.name,
    latitude,
    longitude,
    note: record.note,
    rawData: record.rawJson as Record<string, unknown>,
    matchedBoardId: record.matchedBoardId,
    matchConfidence: record.matchConfidence,
    distanceMeter: record.distanceMeter,
    diff: (record.diff ?? null) as BoardImportRowProps["diff"] | null,
    suggestedAction: record.suggestedAction,
    finalDecision: record.finalDecision,
    assigneeId: record.assigneeId,
    comment: record.comment,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };

  return new BoardImportRow(props);
};

export const toDomainMissing = (
  record: PrismaBoardImportMissing
): BoardImportMissing => {
  const props: BoardImportMissingProps = {
    id: record.id,
    batchId: record.batchId,
    boardId: record.boardId,
    reason: record.reason,
    finalDecision: record.finalDecision,
    comment: record.comment,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };

  return new BoardImportMissing(props);
};
