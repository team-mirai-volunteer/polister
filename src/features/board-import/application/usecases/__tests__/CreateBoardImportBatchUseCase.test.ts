import type { ParsedBoardImportRow } from "@/features/board-import/application/services/BoardImportCsvParser";
import {
  filterRowsForMunicipality,
  normalizeMunicipalityValue,
} from "@/features/board-import/application/usecases/CreateBoardImportBatchUseCase";

const createRow = (
  overrides: Partial<ParsedBoardImportRow>
): ParsedBoardImportRow => ({
  prefecture: "神奈川県",
  city: "横浜市",
  boardNumber: "1",
  address: "神奈川県横浜市西区みなとみらい1-1",
  name: "みなとみらい駅前掲示場",
  latitude: 35.4546,
  longitude: 139.6302,
  note: null,
  raw: {},
  ...overrides,
});

describe("normalizeMunicipalityValue", () => {
  it("should trim whitespace and normalize width", () => {
    expect(normalizeMunicipalityValue(" 横浜市 ")).toBe("横浜市".toLowerCase());
    expect(normalizeMunicipalityValue("横浜市　港北区")).toBe(
      "横浜市港北区".toLowerCase()
    );
  });

  it("should return empty string for nullish values", () => {
    expect(normalizeMunicipalityValue(undefined)).toBe("");
    expect(normalizeMunicipalityValue(null)).toBe("");
  });
});

describe("filterRowsForMunicipality", () => {
  const municipality = {
    prefecture: "神奈川県",
    name: "横浜市",
  };

  it("includes rows that exactly match prefecture and city", () => {
    const rows = [createRow({})];
    const result = filterRowsForMunicipality(rows, municipality);
    expect(result).toHaveLength(1);
  });

  it("excludes rows from different prefectures even if city matches", () => {
    const rows = [createRow({ prefecture: "東京都" })];
    const result = filterRowsForMunicipality(rows, municipality);
    expect(result).toHaveLength(0);
  });

  it("includes rows where city contains ward suffix for designated cities", () => {
    const rows = [createRow({ city: "横浜市港北区" })];
    const result = filterRowsForMunicipality(rows, municipality);
    expect(result).toHaveLength(1);
  });

  it("includes rows when source city is shorter and address starts with remaining tail", () => {
    const rows = [
      createRow({
        city: "横浜",
        address: "市西区みなとみらい1-1",
      }),
    ];
    const result = filterRowsForMunicipality(rows, municipality);
    expect(result).toHaveLength(1);
  });

  it("excludes rows when tail does not match address continuation", () => {
    const rows = [
      createRow({
        city: "横浜",
        address: "東京都港区赤坂1-1",
      }),
    ];
    const result = filterRowsForMunicipality(rows, municipality);
    expect(result).toHaveLength(0);
  });

  it("excludes rows with similar city names after normalization", () => {
    const rows = [createRow({ city: "横浜町" })];
    const result = filterRowsForMunicipality(rows, municipality);
    expect(result).toHaveLength(0);
  });

  it("handles full-width spaces and casing differences", () => {
    const rows = [
      createRow({
        prefecture: "　神奈川県　",
        city: " 横浜市 ",
      }),
    ];
    const result = filterRowsForMunicipality(rows, municipality);
    expect(result).toHaveLength(1);
  });
});
