/**
 * BoardImportRow エンティティ
 */

import type {
  BoardImportMatchConfidence,
  BoardImportRowDecision,
  BoardImportSuggestedAction,
} from "@/features/board-import/domain/types/BoardImportTypes";
import {
  BOARD_NUMBER_MAX_LENGTH,
  BOARD_NUMBER_PATTERN,
} from "@/shared/domain/board/BoardNumber";

export interface BoardImportRowDiffEntry {
  previous: unknown;
  next: unknown;
}

export type BoardImportRowDiff = Record<string, BoardImportRowDiffEntry>;

export interface BoardImportRowProps {
  id: string;
  batchId: string;
  prefecture: string;
  city: string;
  boardNumber: string | null;
  address: string;
  name: string | null;
  latitude: number;
  longitude: number;
  note: string | null;
  rawData: Record<string, unknown>;
  matchedBoardId: string | null;
  matchConfidence: BoardImportMatchConfidence;
  distanceMeter: number | null;
  diff: BoardImportRowDiff | null;
  suggestedAction: BoardImportSuggestedAction;
  finalDecision: BoardImportRowDecision | null;
  assigneeId: string | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class BoardImportRow {
  constructor(private readonly props: Readonly<BoardImportRowProps>) {
    if (!props.id) {
      throw new Error("BoardImportRow requires id");
    }

    if (!props.batchId) {
      throw new Error("BoardImportRow requires batchId");
    }

    if (!props.prefecture) {
      throw new Error("BoardImportRow requires prefecture");
    }

    if (!props.city) {
      throw new Error("BoardImportRow requires city");
    }

    if (!props.address) {
      throw new Error("BoardImportRow requires address");
    }

    if (props.boardNumber !== null) {
      if (typeof props.boardNumber !== "string") {
        throw new Error("BoardImportRow boardNumber must be a string");
      }

      const trimmed = props.boardNumber.trim();
      if (
        trimmed.length === 0 ||
        trimmed.length > BOARD_NUMBER_MAX_LENGTH ||
        !BOARD_NUMBER_PATTERN.test(trimmed)
      ) {
        throw new Error(
          "BoardImportRow boardNumber must match numeric or `xx-x` format"
        );
      }
    }

    if (typeof props.latitude !== "number" || Number.isNaN(props.latitude)) {
      throw new Error("BoardImportRow latitude must be a number");
    }

    if (typeof props.longitude !== "number" || Number.isNaN(props.longitude)) {
      throw new Error("BoardImportRow longitude must be a number");
    }

    if (!(props.createdAt instanceof Date)) {
      throw new Error("BoardImportRow createdAt must be a Date");
    }

    if (!(props.updatedAt instanceof Date)) {
      throw new Error("BoardImportRow updatedAt must be a Date");
    }

    if (!props.rawData || typeof props.rawData !== "object") {
      throw new Error("BoardImportRow rawData must be a non-null object");
    }
  }

  get id(): string {
    return this.props.id;
  }

  get batchId(): string {
    return this.props.batchId;
  }

  get prefecture(): string {
    return this.props.prefecture;
  }

  get city(): string {
    return this.props.city;
  }

  get boardNumber(): string | null {
    return this.props.boardNumber;
  }

  get address(): string {
    return this.props.address;
  }

  get name(): string | null {
    return this.props.name;
  }

  get latitude(): number {
    return this.props.latitude;
  }

  get longitude(): number {
    return this.props.longitude;
  }

  get note(): string | null {
    return this.props.note;
  }

  get rawData(): Record<string, unknown> {
    return this.props.rawData;
  }

  get matchedBoardId(): string | null {
    return this.props.matchedBoardId;
  }

  get matchConfidence(): BoardImportMatchConfidence {
    return this.props.matchConfidence;
  }

  get distanceMeter(): number | null {
    return this.props.distanceMeter;
  }

  get diff(): BoardImportRowDiff | null {
    return this.props.diff;
  }

  get suggestedAction(): BoardImportSuggestedAction {
    return this.props.suggestedAction;
  }

  get finalDecision(): BoardImportRowDecision | null {
    return this.props.finalDecision;
  }

  get assigneeId(): string | null {
    return this.props.assigneeId;
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

  hasPendingDecision(): boolean {
    return this.props.finalDecision === null;
  }
}
