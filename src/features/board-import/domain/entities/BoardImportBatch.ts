/**
 * BoardImportBatch エンティティ
 */

import type { BoardImportStatus } from "@/features/board-import/domain/types/BoardImportTypes";

export interface BoardImportBatchProps {
  id: string;
  municipalityId: string;
  status: BoardImportStatus;
  sourceFileName: string;
  storagePath: string;
  fileSize: number;
  checksum: string;
  totalRows: number;
  matchedCount: number;
  newCount: number;
  missingCount: number;
  updatedCount: number;
  duplicateCount: number;
  uploadedBy: string | null;
  uploadedAt: Date;
  confirmedBy?: string | null;
  confirmedAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class BoardImportBatch {
  constructor(private readonly props: Readonly<BoardImportBatchProps>) {
    if (!props.id) {
      throw new Error("BoardImportBatch requires id");
    }

    if (!props.municipalityId) {
      throw new Error("BoardImportBatch requires municipalityId");
    }

    if (!props.sourceFileName) {
      throw new Error("BoardImportBatch requires sourceFileName");
    }

    if (!props.storagePath) {
      throw new Error("BoardImportBatch requires storagePath");
    }

    if (props.fileSize < 0) {
      throw new Error("BoardImportBatch fileSize must be non-negative");
    }

    if (!props.checksum) {
      throw new Error("BoardImportBatch requires checksum");
    }

    const numericProps: Array<[keyof BoardImportBatchProps, number]> = [
      ["totalRows", props.totalRows],
      ["matchedCount", props.matchedCount],
      ["newCount", props.newCount],
      ["missingCount", props.missingCount],
      ["updatedCount", props.updatedCount],
      ["duplicateCount", props.duplicateCount],
    ];

    numericProps.forEach(([key, value]) => {
      if (!Number.isInteger(value) || value < 0) {
        throw new Error(
          `BoardImportBatch ${String(key)} must be a non-negative integer`
        );
      }
    });

    if (!(props.uploadedAt instanceof Date)) {
      throw new Error("BoardImportBatch uploadedAt must be a Date");
    }

    if (props.confirmedAt && !(props.confirmedAt instanceof Date)) {
      throw new Error("BoardImportBatch confirmedAt must be a Date when set");
    }

    if (!(props.createdAt instanceof Date)) {
      throw new Error("BoardImportBatch createdAt must be a Date");
    }

    if (!(props.updatedAt instanceof Date)) {
      throw new Error("BoardImportBatch updatedAt must be a Date");
    }
  }

  get id(): string {
    return this.props.id;
  }

  get municipalityId(): string {
    return this.props.municipalityId;
  }

  get status(): BoardImportStatus {
    return this.props.status;
  }

  get sourceFileName(): string {
    return this.props.sourceFileName;
  }

  get storagePath(): string {
    return this.props.storagePath;
  }

  get fileSize(): number {
    return this.props.fileSize;
  }

  get checksum(): string {
    return this.props.checksum;
  }

  get totalRows(): number {
    return this.props.totalRows;
  }

  get matchedCount(): number {
    return this.props.matchedCount;
  }

  get newCount(): number {
    return this.props.newCount;
  }

  get missingCount(): number {
    return this.props.missingCount;
  }

  get updatedCount(): number {
    return this.props.updatedCount;
  }

  get duplicateCount(): number {
    return this.props.duplicateCount;
  }

  get uploadedBy(): string | null {
    return this.props.uploadedBy ?? null;
  }

  get uploadedAt(): Date {
    return this.props.uploadedAt;
  }

  get confirmedBy(): string | null | undefined {
    return this.props.confirmedBy ?? null;
  }

  get confirmedAt(): Date | null | undefined {
    return this.props.confirmedAt ?? null;
  }

  get notes(): string | null | undefined {
    return this.props.notes ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get reviewProgress(): number {
    if (this.totalRows === 0) {
      return 0;
    }

    const processed =
      this.matchedCount +
      this.newCount +
      this.updatedCount +
      this.duplicateCount +
      this.missingCount;
    return Math.min(1, processed / this.totalRows);
  }

  isReviewCompleted(): boolean {
    return this.reviewProgress === 1;
  }
}
