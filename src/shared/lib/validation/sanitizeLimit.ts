export interface SanitizeLimitOptions {
  max?: number;
}

export function sanitizeLimit(
  value: unknown,
  options: SanitizeLimitOptions = {}
): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  const normalized = Math.floor(value);
  const { max } = options;

  if (typeof max === "number" && Number.isFinite(max) && max > 0) {
    return Math.min(normalized, Math.floor(max));
  }

  return normalized;
}
