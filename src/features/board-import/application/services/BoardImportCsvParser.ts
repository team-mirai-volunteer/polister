import { parse } from "csv-parse/sync";

export interface ParsedBoardImportRow {
  prefecture: string;
  city: string;
  boardNumber: number | null;
  address: string;
  name: string | null;
  latitude: number;
  longitude: number;
  note: string | null;
  raw: Record<string, unknown>;
}

const REQUIRED_HEADERS = [
  "prefecture",
  "city",
  "address",
  "lat",
  "long",
] as const;

type RequiredHeader = (typeof REQUIRED_HEADERS)[number];

const HEADER_ALIASES: Record<
  string,
  RequiredHeader | "number" | "name" | "note"
> = {
  longitude: "long",
  latitude: "lat",
  board_number: "number",
  boardNo: "number",
};

const normalizeHeader = (header: string): string => {
  const lower = header.trim().toLowerCase();
  return HEADER_ALIASES[lower] ?? lower;
};

const toNumberOrNull = (value: string | null | undefined): number | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number.parseFloat(trimmed);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
};

const toIntegerOrNull = (value: string | null | undefined): number | null => {
  const num = toNumberOrNull(value);
  if (num === null) {
    return null;
  }

  if (!Number.isInteger(num)) {
    return null;
  }

  return num;
};

export class BoardImportCsvParser {
  parse(buffer: Buffer): ParsedBoardImportRow[] {
    const decoded = buffer.toString("utf8");
    const records = parse(decoded, {
      columns: (headers: string[]) =>
        headers.map((header) => normalizeHeader(header)),
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string | null>[];

    if (records.length === 0) {
      throw new Error("CSVにデータが含まれていません。");
    }

    const headers = Object.keys(records[0] ?? {});
    const missingHeaders = REQUIRED_HEADERS.filter(
      (required) => !headers.includes(required)
    );
    if (missingHeaders.length > 0) {
      throw new Error(
        `CSVに必須列が不足しています: ${missingHeaders.join(", ")}`
      );
    }

    const normalized = records.map<ParsedBoardImportRow>((row, index) => {
      const rawEntries = Object.entries(row);
      const raw: Record<string, unknown> = {};
      rawEntries.forEach(([key, value]) => {
        raw[key] = value;
      });

      const latitude = toNumberOrNull(row.lat);
      const longitude = toNumberOrNull(row.long);

      if (latitude === null || longitude === null) {
        throw new Error(
          `CSV ${index + 2}行目の緯度経度が無効です。（lat/long列を確認してください）`
        );
      }

      const prefecture = row.prefecture?.trim();
      const city = row.city?.trim();
      const address = row.address?.trim();

      if (!prefecture || !city || !address) {
        throw new Error(
          `CSV ${index + 2}行目の必須フィールド（prefecture/city/address）が不足しています。`
        );
      }

      return {
        prefecture,
        city,
        boardNumber: toIntegerOrNull(row.number),
        address,
        name: row.name ?? null,
        latitude,
        longitude,
        note: row.note ?? null,
        raw,
      };
    });

    return normalized;
  }
}
