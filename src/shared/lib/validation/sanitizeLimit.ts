export interface SanitizeLimitOptions {
  max?: number;
}

export function sanitizeLimit(
  value: unknown,
  options: SanitizeLimitOptions = {}
): number | undefined {
  let numeric: number;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    numeric = Number(trimmed);
  } else {
    numeric = value as number;
  }

  if (
    typeof numeric !== "number" ||
    !Number.isFinite(numeric) ||
    numeric <= 0
  ) {
    return undefined;
  }

  const normalized = Math.floor(numeric);
  const { max } = options;

  if (typeof max === "number" && Number.isFinite(max) && max > 0) {
    return Math.min(normalized, Math.floor(max));
  }

  return normalized;
}
