import { ParsedBoardImportRow } from "@/features/board-import/application/services/BoardImportCsvParser";
import { BoardImportRowDiff } from "@/features/board-import/domain/entities/BoardImportRow";
import type { ExistingBoardSnapshot } from "@/features/board-import/domain/repositories/IBoardImportRepository";
import type {
  BoardImportMatchConfidence,
  BoardImportRowDecision,
  BoardImportSuggestedAction,
} from "@/features/board-import/domain/types/BoardImportTypes";
import { distance, point } from "@turf/turf";

export interface BoardImportDiffRow {
  parsed: ParsedBoardImportRow;
  matchedBoard: ExistingBoardSnapshot | null;
  matchConfidence: BoardImportMatchConfidence;
  distanceMeter: number | null;
  diff: BoardImportRowDiff | null;
  suggestedAction: BoardImportSuggestedAction;
  finalDecision: BoardImportRowDecision | null;
}

export interface BoardImportDiffResult {
  rows: BoardImportDiffRow[];
  missingBoards: ExistingBoardSnapshot[];
  stats: {
    matchedCount: number;
    updatedCount: number;
    newCount: number;
    duplicateCount: number;
    missingCount: number;
  };
}

const DISTANCE_THRESHOLD_METERS = 30;
const DISTANCE_WARNING_METERS = 80;

const toMeters = (value: number): number =>
  Math.round((value + Number.EPSILON) * 1000) / 1000;

const calculateDistanceMeters = (
  row: ParsedBoardImportRow,
  board: ExistingBoardSnapshot
): number | null => {
  if (board.latitude === null || board.longitude === null) {
    return null;
  }

  const from = point([row.longitude, row.latitude]);
  const to = point([board.longitude, board.latitude]);

  const km = distance(from, to, { units: "kilometers" });
  return toMeters(km * 1000);
};

const buildDiff = (
  row: ParsedBoardImportRow,
  board: ExistingBoardSnapshot
): BoardImportRowDiff | null => {
  const diff: BoardImportRowDiff = {};

  if ((board.name ?? null) !== (row.name ?? null)) {
    diff.name = { previous: board.name, next: row.name };
  }

  if (board.address !== row.address) {
    diff.address = { previous: board.address, next: row.address };
  }

  if ((board.note ?? null) !== (row.note ?? null)) {
    diff.note = { previous: board.note, next: row.note };
  }

  const distanceMeters = calculateDistanceMeters(row, board);
  const hasExistingLocation =
    board.longitude !== null && board.latitude !== null;

  if (
    !hasExistingLocation ||
    (distanceMeters !== null && distanceMeters > 0.5)
  ) {
    diff.location = {
      previous: { longitude: board.longitude, latitude: board.latitude },
      next: { longitude: row.longitude, latitude: row.latitude },
    };
  }

  return Object.keys(diff).length > 0 ? diff : null;
};

export class BoardImportDiffer {
  execute(
    rows: ParsedBoardImportRow[],
    existingBoards: ExistingBoardSnapshot[]
  ): BoardImportDiffResult {
    const boardByNumber = new Map<number, ExistingBoardSnapshot>();
    const unmatchedBoards = new Map<string, ExistingBoardSnapshot>();

    existingBoards.forEach((board) => {
      unmatchedBoards.set(board.id, board);
      if (board.boardNumber !== null) {
        boardByNumber.set(board.boardNumber, board);
      }
    });

    const matchedBoardIds = new Set<string>();
    const diffRows: BoardImportDiffRow[] = [];

    rows.forEach((row) => {
      const matchByNumber =
        row.boardNumber !== null
          ? (boardByNumber.get(row.boardNumber) ?? null)
          : null;

      let matched: ExistingBoardSnapshot | null = null;
      let matchConfidence: BoardImportMatchConfidence = "NONE";

      if (matchByNumber && !matchedBoardIds.has(matchByNumber.id)) {
        matched = matchByNumber;
        matchConfidence = "HIGH";
      } else if (matchByNumber && matchedBoardIds.has(matchByNumber.id)) {
        const distanceMeter = matchByNumber
          ? calculateDistanceMeters(row, matchByNumber)
          : null;

        diffRows.push({
          parsed: row,
          matchedBoard: matchByNumber,
          matchConfidence: "HIGH",
          distanceMeter,
          diff: null,
          suggestedAction: "SKIP",
          finalDecision: null,
        });
        return;
      }

      if (!matched) {
        let bestCandidateBoard: ExistingBoardSnapshot | null = null;
        let bestCandidateDistance = Number.POSITIVE_INFINITY;

        unmatchedBoards.forEach((board) => {
          const distanceMeters = calculateDistanceMeters(row, board);
          if (distanceMeters === null) {
            return;
          }

          if (distanceMeters > DISTANCE_WARNING_METERS) {
            return;
          }

          if (!bestCandidateBoard || distanceMeters < bestCandidateDistance) {
            bestCandidateBoard = board;
            bestCandidateDistance = distanceMeters;
          }
        });

        if (bestCandidateBoard !== null) {
          matched = bestCandidateBoard;
          matchConfidence =
            bestCandidateDistance <= DISTANCE_THRESHOLD_METERS
              ? "MEDIUM"
              : "LOW";
        }
      }

      let diff: BoardImportRowDiff | null = null;
      let suggestedAction: BoardImportSuggestedAction = "CREATE";
      let distanceMeter: number | null = null;

      if (matched) {
        matchedBoardIds.add(matched.id);
        unmatchedBoards.delete(matched.id);
        distanceMeter = calculateDistanceMeters(row, matched);
        diff = buildDiff(row, matched);
        suggestedAction = diff ? "UPDATE" : "KEEP";
      } else {
        suggestedAction = "CREATE";
      }

      diffRows.push({
        parsed: row,
        matchedBoard: matched,
        matchConfidence,
        distanceMeter,
        diff,
        suggestedAction,
        finalDecision: null,
      });
    });

    const missingBoards = Array.from(unmatchedBoards.values());

    const stats = {
      matchedCount: diffRows.filter(
        (row) => row.matchedBoard && row.suggestedAction === "KEEP"
      ).length,
      updatedCount: diffRows.filter(
        (row) => row.matchedBoard && row.suggestedAction === "UPDATE"
      ).length,
      newCount: diffRows.filter(
        (row) => !row.matchedBoard && row.suggestedAction === "CREATE"
      ).length,
      duplicateCount: diffRows.filter((row) => row.suggestedAction === "SKIP")
        .length,
      missingCount: missingBoards.length,
    };

    return {
      rows: diffRows,
      missingBoards,
      stats,
    };
  }
}
