import type {
  BoardImportBatch,
  BoardImportBatchProps,
} from "@/features/board-import/domain/entities/BoardImportBatch";
import type {
  BoardImportMissing,
  BoardImportMissingProps,
} from "@/features/board-import/domain/entities/BoardImportMissing";
import type {
  BoardImportRow,
  BoardImportRowProps,
} from "@/features/board-import/domain/entities/BoardImportRow";
import type {
  BoardImportMissingDecision,
  BoardImportRowDecision,
  BoardImportStatus,
} from "@/features/board-import/domain/types/BoardImportTypes";

export interface CreateBoardImportBatchInput
  extends Omit<
    BoardImportBatchProps,
    | "id"
    | "status"
    | "matchedCount"
    | "newCount"
    | "missingCount"
    | "updatedCount"
    | "duplicateCount"
    | "uploadedBy"
    | "confirmedBy"
    | "confirmedAt"
    | "createdAt"
    | "updatedAt"
    | "notes"
  > {
  status?: BoardImportStatus;
  matchedCount?: number;
  newCount?: number;
  missingCount?: number;
  updatedCount?: number;
  duplicateCount?: number;
  notes?: string | null;
  confirmedBy?: string | null;
  confirmedAt?: Date | null;
  uploadedBy?: string | null;
}

export type CreateBoardImportRowInput = Omit<
  BoardImportRowProps,
  "id" | "batchId" | "createdAt" | "updatedAt"
>;

export type CreateBoardImportMissingInput = Omit<
  BoardImportMissingProps,
  "id" | "batchId" | "finalDecision" | "createdAt" | "updatedAt"
> & {
  finalDecision?: BoardImportMissingDecision | null;
};

export interface ListBoardImportBatchesFilter {
  municipalityId?: string;
  status?: BoardImportStatus;
  uploadedBy?: string;
  limit?: number;
  cursor?: string;
}

export interface ListBoardImportBatchesResult {
  items: BoardImportBatch[];
  nextCursor: string | null;
}

export interface UpdateBoardImportBatchStatsInput {
  matchedCount?: number;
  newCount?: number;
  missingCount?: number;
  updatedCount?: number;
  duplicateCount?: number;
}

export interface UpdateBoardImportBatchStatusInput {
  status: BoardImportStatus;
  confirmedBy?: string | null;
  confirmedAt?: Date | null;
  notes?: string | null;
}

export interface UpdateBoardImportRowDecisionInput {
  finalDecision: BoardImportRowDecision | null;
  assigneeId?: string | null;
  comment?: string | null;
}

export interface UpdateBoardImportMissingDecisionInput {
  finalDecision: BoardImportMissingDecision | null;
  comment?: string | null;
}

export interface ExistingBoardSnapshot {
  id: string;
  boardNumber: string | null;
  address: string;
  name: string | null;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  status: string;
  trustLevel: string;
  updatedAt: Date;
}

export interface IBoardImportRepository {
  createBatchWithDetails(params: {
    batch: CreateBoardImportBatchInput;
    rows: CreateBoardImportRowInput[];
    missing: CreateBoardImportMissingInput[];
  }): Promise<{
    batch: BoardImportBatch;
    rows: BoardImportRow[];
    missing: BoardImportMissing[];
  }>;

  createBatch(input: CreateBoardImportBatchInput): Promise<BoardImportBatch>;

  updateBatchStats(
    batchId: string,
    stats: UpdateBoardImportBatchStatsInput
  ): Promise<BoardImportBatch>;

  updateBatchStatus(
    batchId: string,
    input: UpdateBoardImportBatchStatusInput
  ): Promise<BoardImportBatch>;

  findBatchById(batchId: string): Promise<BoardImportBatch | null>;

  listBatches(
    filter?: ListBoardImportBatchesFilter
  ): Promise<ListBoardImportBatchesResult>;

  createRows(
    batchId: string,
    rows: CreateBoardImportRowInput[]
  ): Promise<BoardImportRow[]>;

  findRowsByBatchId(batchId: string): Promise<BoardImportRow[]>;

  updateRowDecision(
    rowId: string,
    input: UpdateBoardImportRowDecisionInput
  ): Promise<BoardImportRow>;

  createMissing(
    batchId: string,
    missing: CreateBoardImportMissingInput[]
  ): Promise<BoardImportMissing[]>;

  findMissingByBatchId(batchId: string): Promise<BoardImportMissing[]>;

  updateMissingDecision(
    missingId: string,
    input: UpdateBoardImportMissingDecisionInput
  ): Promise<BoardImportMissing>;

  findExistingBoardsByMunicipality(
    municipalityId: string
  ): Promise<ExistingBoardSnapshot[]>;

  findExistingBoardsByIds(boardIds: string[]): Promise<ExistingBoardSnapshot[]>;
}
