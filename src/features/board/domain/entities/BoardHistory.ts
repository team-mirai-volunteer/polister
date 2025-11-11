/**
 * BoardHistory エンティティ
 *
 * 掲示場の変更履歴
 */

import type { BoardSnapshot } from "../aggregates/Board";

export type ChangeReason =
  | "MANUAL_INPUT"
  | "DATA_SOURCE_IMPORT"
  | "FIELD_VERIFICATION"
  | "ERROR_CORRECTION"
  | "DATA_NORMALIZATION"
  | "GEOCODING_UPDATE"
  | "MIGRATION"
  | "SYSTEM_UPDATE"
  | "OTHER";

export interface BoardHistoryProps {
  id: string;
  boardId: string;
  importBatchId: string | null;
  beforeData: BoardSnapshot | null;
  afterData: BoardSnapshot;
  changeReason: ChangeReason;
  userId: string | null;
  comment: string | null;
  changedAt: Date;
}

export interface CreateBoardHistoryCommand {
  boardId: string;
  importBatchId?: string | null;
  beforeData: BoardSnapshot | null;
  afterData: BoardSnapshot;
  changeReason: ChangeReason;
  userId?: string | null;
  comment?: string | null;
}

export class BoardHistory {
  private readonly props: BoardHistoryProps;

  constructor(props: BoardHistoryProps) {
    if (!props.id || typeof props.id !== "string") {
      throw new Error("BoardHistory requires a valid id");
    }

    if (!props.boardId || typeof props.boardId !== "string") {
      throw new Error("BoardHistory requires a valid boardId");
    }

    if (!(props.changedAt instanceof Date)) {
      throw new Error("BoardHistory changedAt must be a Date");
    }

    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get boardId(): string {
    return this.props.boardId;
  }

  get importBatchId(): string | null {
    return this.props.importBatchId;
  }

  get beforeData(): BoardSnapshot | null {
    return this.props.beforeData;
  }

  get afterData(): BoardSnapshot {
    return this.props.afterData;
  }

  get changeReason(): ChangeReason {
    return this.props.changeReason;
  }

  get userId(): string | null {
    return this.props.userId;
  }

  get comment(): string | null {
    return this.props.comment;
  }

  get changedAt(): Date {
    return this.props.changedAt;
  }

  /**
   * 変更差分を取得
   */
  getDiff(): BoardHistoryDiff {
    const before = this.props.beforeData;
    const after = this.props.afterData;

    if (!before) {
      return {
        isCreation: true,
        changes: [],
      };
    }

    const changes: FieldChange[] = [];

    // 各フィールドの変更をチェック
    if (before.boardNumber !== after.boardNumber) {
      changes.push({
        field: "boardNumber",
        before: before.boardNumber,
        after: after.boardNumber,
      });
    }

    if (before.name !== after.name) {
      changes.push({
        field: "name",
        before: before.name,
        after: after.name,
      });
    }

    if (before.address !== after.address) {
      changes.push({
        field: "address",
        before: before.address,
        after: after.address,
      });
    }

    if (
      before.latitude !== after.latitude ||
      before.longitude !== after.longitude
    ) {
      changes.push({
        field: "coordinates",
        before: `(${before.latitude}, ${before.longitude})`,
        after: `(${after.latitude}, ${after.longitude})`,
      });
    }

    if (before.status !== after.status) {
      changes.push({
        field: "status",
        before: before.status,
        after: after.status,
      });
    }

    if (before.trustLevel !== after.trustLevel) {
      changes.push({
        field: "trustLevel",
        before: before.trustLevel,
        after: after.trustLevel,
      });
    }

    if (before.note !== after.note) {
      changes.push({
        field: "note",
        before: before.note,
        after: after.note,
      });
    }

    return {
      isCreation: false,
      changes,
    };
  }
}

export interface BoardHistoryDiff {
  isCreation: boolean;
  changes: FieldChange[];
}

export interface FieldChange {
  field: string;
  before: unknown;
  after: unknown;
}
