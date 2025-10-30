/**
 * Feature flag utilities.
 *
 * Note: 本実装は簡易的な環境変数ベースのフラグであり、
 * 将来的に認証/認可と統合する際は刷新する予定。
 */

const resolveFlag = (
  serverKey: string,
  clientKey: string
): string | undefined =>
  typeof window === "undefined"
    ? (process.env[serverKey] ?? process.env[clientKey])
    : process.env[clientKey];

const BOARD_IMPORT_FEATURE_FLAG_KEY = "BOARD_IMPORT_FEATURE_ENABLED";
const BOARD_IMPORT_FEATURE_FLAG_PUBLIC_KEY =
  "NEXT_PUBLIC_BOARD_IMPORT_FEATURE_ENABLED";

export const isBoardImportFeatureEnabled = (): boolean => {
  const rawValue = resolveFlag(
    BOARD_IMPORT_FEATURE_FLAG_KEY,
    BOARD_IMPORT_FEATURE_FLAG_PUBLIC_KEY
  );

  return rawValue === "true";
};
