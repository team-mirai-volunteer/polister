/**
 * Board向けのステータス・信頼度に関する列挙型
 */

export const BOARD_STATUS_VALUES = ["PENDING", "VERIFIED", "REJECTED"] as const;
export type BoardStatus = (typeof BOARD_STATUS_VALUES)[number];

export const TRUST_LEVEL_VALUES = [
  "LEVEL_1",
  "LEVEL_2",
  "LEVEL_3",
  "LEVEL_4",
] as const;
export type TrustLevel = (typeof TRUST_LEVEL_VALUES)[number];

export const isBoardStatus = (value: string): value is BoardStatus =>
  (BOARD_STATUS_VALUES as readonly string[]).includes(value);

export const isTrustLevel = (value: string): value is TrustLevel =>
  (TRUST_LEVEL_VALUES as readonly string[]).includes(value);
