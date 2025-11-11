export const BOARD_NUMBER_PATTERN =
  /^[\p{Letter}\p{Number}]+(?:-[\p{Letter}\p{Number}]+)*$/u;
export const BOARD_NUMBER_MAX_LENGTH = 16;

const FULL_WIDTH_HYPHENS = /[－―ー﹣−]/g;

export const normalizeBoardNumber = (
  value: string | number | null | undefined
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = String(value).trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > BOARD_NUMBER_MAX_LENGTH) {
    throw new Error(
      `掲示場番号は最大${BOARD_NUMBER_MAX_LENGTH}文字までにしてください。`
    );
  }

  const normalized = trimmed.replace(FULL_WIDTH_HYPHENS, "-");

  if (!BOARD_NUMBER_PATTERN.test(normalized)) {
    throw new Error(
      "掲示場番号は英数字や日本語などの文字列（必要に応じてハイフン区切り）で入力してください。"
    );
  }

  if (/^\d+$/.test(normalized)) {
    const stripped = normalized.replace(/^0+(?=\d)/, "");
    return stripped.length > 0 ? stripped : "0";
  }

  return normalized;
};

export const compareBoardNumbers = (
  left: string | null,
  right: string | null
): number => {
  if (left === null && right === null) {
    return 0;
  }
  if (left === null) {
    return 1;
  }
  if (right === null) {
    return -1;
  }

  const leftSegments = left.split("-").map((segment) => Number(segment));
  const rightSegments = right.split("-").map((segment) => Number(segment));
  const maxLength = Math.max(leftSegments.length, rightSegments.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = leftSegments[index];
    const rightValue = rightSegments[index];

    if (leftValue === undefined && rightValue === undefined) {
      break;
    }
    if (leftValue === undefined) {
      return -1;
    }
    if (rightValue === undefined) {
      return 1;
    }
    if (Number.isFinite(leftValue) && Number.isFinite(rightValue)) {
      if (leftValue !== rightValue) {
        return leftValue - rightValue;
      }
    } else if (Number.isFinite(leftValue)) {
      return -1;
    } else if (Number.isFinite(rightValue)) {
      return 1;
    }
  }

  return left.localeCompare(right, "ja");
};

export const formatBoardNumberLabel = (
  value: string | null | undefined
): string => {
  if (value === null || value === undefined || value.trim().length === 0) {
    return "-";
  }

  return value;
};
