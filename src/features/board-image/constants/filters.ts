export const BOARD_IMAGE_FILTER_FIELDS = [
  "csvPrefecture",
  "csvCity",
  "csvBoardNumber",
  "verificationStatus",
  "originalFilename",
] as const;

export type BoardImageFilterField = (typeof BOARD_IMAGE_FILTER_FIELDS)[number];

export type BoardImageFilterOperator =
  | "contains"
  | "startsWith"
  | "endsWith"
  | "equals";

export const BOARD_IMAGE_FILTER_OPERATORS: Record<
  BoardImageFilterField,
  BoardImageFilterOperator[]
> = {
  csvPrefecture: ["contains", "startsWith", "endsWith", "equals"],
  csvCity: ["contains", "startsWith", "endsWith", "equals"],
  csvBoardNumber: ["contains", "startsWith", "endsWith", "equals"],
  verificationStatus: ["equals"],
  originalFilename: ["contains", "startsWith", "endsWith", "equals"],
};

export const BOARD_IMAGE_NO_VALUE_OPERATORS =
  new Set<BoardImageFilterOperator>();

export const defaultOperatorForField = (
  field: BoardImageFilterField
): BoardImageFilterOperator => {
  if (field === "verificationStatus") {
    return "equals";
  }
  return "contains";
};

export const sanitizeFilterField = (
  value: string | undefined
): BoardImageFilterField | undefined => {
  if (!value) {
    return undefined;
  }
  return BOARD_IMAGE_FILTER_FIELDS.includes(value as BoardImageFilterField)
    ? (value as BoardImageFilterField)
    : undefined;
};

export const sanitizeFilterOperator = (
  field: BoardImageFilterField,
  operator: string | undefined
): BoardImageFilterOperator => {
  if (!operator) {
    return defaultOperatorForField(field);
  }

  const allowed = BOARD_IMAGE_FILTER_OPERATORS[field];

  return allowed.includes(operator as BoardImageFilterOperator)
    ? (operator as BoardImageFilterOperator)
    : defaultOperatorForField(field);
};

export interface BoardImageFilter {
  field: BoardImageFilterField;
  operator: BoardImageFilterOperator;
  value?: string;
}
