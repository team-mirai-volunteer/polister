/**
 * BoardImportMissing エンティティ
 */

import type {
  BoardImportMissingDecision,
  BoardImportMissingReason,
} from "@/features/board-import/domain/types/BoardImportTypes";

export interface BoardImportMissingProps {
  id: string;
  batchId: string;
  boardId: string;
  reason: BoardImportMissingReason;
  finalDecision: BoardImportMissingDecision | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class BoardImportMissing {
  constructor(private readonly props: Readonly<BoardImportMissingProps>) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error("BoardImportMissing requires id");
    }

    if (!props.batchId || props.batchId.trim().length === 0) {
      throw new Error("BoardImportMissing requires batchId");
    }

    if (!props.boardId || props.boardId.trim().length === 0) {
      throw new Error("BoardImportMissing requires boardId");
    }

    if (
      !(props.createdAt instanceof Date) ||
      Number.isNaN(props.createdAt.getTime())
    ) {
      throw new Error("BoardImportMissing createdAt must be a Date");
    }

    if (
      !(props.updatedAt instanceof Date) ||
      Number.isNaN(props.updatedAt.getTime())
    ) {
      throw new Error("BoardImportMissing updatedAt must be a Date");
    }
  }

  get id(): string {
    return this.props.id;
  }

  get batchId(): string {
    return this.props.batchId;
  }

  get boardId(): string {
    return this.props.boardId;
  }

  get reason(): BoardImportMissingReason {
    return this.props.reason;
  }

  get finalDecision(): BoardImportMissingDecision | null {
    return this.props.finalDecision;
  }

  get comment(): string | null {
    return this.props.comment;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
