/**
 * 自治体関連の定数定義
 */

import type {
  BoardStatus,
  TrustLevel,
} from "./domain/value-objects/BoardAttributes";

/**
 * 自治体ステータスの日本語ラベル
 */
export const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "未着手",
  IN_PROGRESS: "作業中",
  CONTACTING: "問い合わせ中",
  DIGITIZING: "デジタル化中",
  PDF_COMPLETED: "PDF完了",
  CSV_COMPLETED: "CSV完了",
  COMPLETED: "完了",
  QUALITY_CHECK: "品質確認中",
  URL_FOUND: "URL発見",
  OTHER: "その他",
  OUT_OF_SCOPE: "対象外",
};

/**
 * 自治体ステータスの色
 */
export const STATUS_COLORS: Record<
  string,
  "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"
> = {
  NOT_STARTED: "default",
  IN_PROGRESS: "info",
  CONTACTING: "info",
  DIGITIZING: "info",
  PDF_COMPLETED: "primary",
  CSV_COMPLETED: "primary",
  COMPLETED: "success",
  QUALITY_CHECK: "warning",
  URL_FOUND: "info",
  OTHER: "default",
  OUT_OF_SCOPE: "error",
};

export const BOARD_STATUS_LABELS = {
  PENDING: "未検証",
  VERIFIED: "検証済み",
  REJECTED: "却下",
} as const satisfies Record<BoardStatus, string>;

export const BOARD_STATUS_COLORS = {
  PENDING: "warning",
  VERIFIED: "success",
  REJECTED: "error",
} as const satisfies Record<
  BoardStatus,
  "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"
>;

export const TRUST_LEVEL_LABELS = {
  LEVEL_1: "公式",
  LEVEL_2: "確信",
  LEVEL_3: "報告",
  LEVEL_4: "未確認",
} as const satisfies Record<TrustLevel, string>;

export const TRUST_LEVEL_COLORS = {
  LEVEL_1: "success",
  LEVEL_2: "primary",
  LEVEL_3: "info",
  LEVEL_4: "warning",
} as const satisfies Record<
  TrustLevel,
  "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"
>;
