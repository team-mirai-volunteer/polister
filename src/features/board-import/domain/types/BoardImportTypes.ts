/**
 * Board Import に関する列挙型および型定義
 */

export const BOARD_IMPORT_STATUS_VALUES = [
  "UPLOADED",
  "REVIEWING",
  "APPLIED",
  "CANCELLED",
] as const;
export type BoardImportStatus = (typeof BOARD_IMPORT_STATUS_VALUES)[number];

export const BOARD_IMPORT_MATCH_CONFIDENCE_VALUES = [
  "HIGH",
  "MEDIUM",
  "LOW",
  "NONE",
] as const;
export type BoardImportMatchConfidence =
  (typeof BOARD_IMPORT_MATCH_CONFIDENCE_VALUES)[number];

export const BOARD_IMPORT_SUGGESTED_ACTION_VALUES = [
  "KEEP",
  "UPDATE",
  "CREATE",
  "SKIP",
] as const;
export type BoardImportSuggestedAction =
  (typeof BOARD_IMPORT_SUGGESTED_ACTION_VALUES)[number];

export const BOARD_IMPORT_ROW_DECISION_VALUES = [
  "UPDATE",
  "CREATE",
  "IGNORE",
] as const;
export type BoardImportRowDecision =
  (typeof BOARD_IMPORT_ROW_DECISION_VALUES)[number];

export const BOARD_IMPORT_MISSING_REASON_VALUES = [
  "NOT_IN_SOURCE",
  "OUT_OF_SCOPE",
] as const;
export type BoardImportMissingReason =
  (typeof BOARD_IMPORT_MISSING_REASON_VALUES)[number];

export const BOARD_IMPORT_MISSING_DECISION_VALUES = [
  "KEEP",
  "SOFT_DELETE",
  "FOLLOW_UP",
] as const;
export type BoardImportMissingDecision =
  (typeof BOARD_IMPORT_MISSING_DECISION_VALUES)[number];

export const isBoardImportStatus = (
  value: string
): value is BoardImportStatus =>
  (BOARD_IMPORT_STATUS_VALUES as readonly string[]).includes(value);

export const isBoardImportMatchConfidence = (
  value: string
): value is BoardImportMatchConfidence =>
  (BOARD_IMPORT_MATCH_CONFIDENCE_VALUES as readonly string[]).includes(value);

export const isBoardImportSuggestedAction = (
  value: string
): value is BoardImportSuggestedAction =>
  (BOARD_IMPORT_SUGGESTED_ACTION_VALUES as readonly string[]).includes(value);

export const isBoardImportRowDecision = (
  value: string
): value is BoardImportRowDecision =>
  (BOARD_IMPORT_ROW_DECISION_VALUES as readonly string[]).includes(value);

export const isBoardImportMissingReason = (
  value: string
): value is BoardImportMissingReason =>
  (BOARD_IMPORT_MISSING_REASON_VALUES as readonly string[]).includes(value);

export const isBoardImportMissingDecision = (
  value: string
): value is BoardImportMissingDecision =>
  (BOARD_IMPORT_MISSING_DECISION_VALUES as readonly string[]).includes(value);
