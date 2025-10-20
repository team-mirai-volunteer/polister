const PREFECTURE_CODE_PATTERN = /^\d{1,2}$/;
const PREFECTURE_CODE_MIN = 1;
const PREFECTURE_CODE_MAX = 47;

export const isPrefectureCodeFormat = (value: string): boolean =>
  PREFECTURE_CODE_PATTERN.test(value.trim());

export const sanitizePrefectureCode = (code: string): string | null => {
  const trimmed = code.trim();

  if (!PREFECTURE_CODE_PATTERN.test(trimmed)) {
    return null;
  }

  const numeric = Number(trimmed);
  if (numeric < PREFECTURE_CODE_MIN || numeric > PREFECTURE_CODE_MAX) {
    return null;
  }

  return trimmed.padStart(2, "0");
};

export const normalizePrefectureCode = (code: string): string => {
  const normalized = sanitizePrefectureCode(code);
  if (!normalized) {
    throw new Error("Invalid prefecture code format");
  }
  return normalized;
};
