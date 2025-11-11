/**
 * Municipality Repository インターフェース
 *
 * 市区町村データの永続化を抽象化するリポジトリインターフェース
 */

import type { Municipality } from "../entities/Municipality";
import type { BoardStatus, TrustLevel } from "../value-objects/BoardAttributes";

export const MUNICIPALITY_FILTER_OPERATORS = [
  "equals",
  "=",
  "notEqual",
  "!=",
  "contains",
  "startsWith",
  "endsWith",
  "greaterThan",
  "gt",
  ">",
  "greaterThanOrEqual",
  "gte",
  ">=",
  "lessThan",
  "lt",
  "<",
  "lessThanOrEqual",
  "lte",
  "<=",
  "isEmpty",
  "isNotEmpty",
] as const;

export type MunicipalityFilterOperator =
  (typeof MUNICIPALITY_FILTER_OPERATORS)[number];

export const MUNICIPALITY_FILTER_FIELDS: ReadonlyArray<
  MunicipalityFilter["field"]
> = ["code", "name", "prefecture", "status", "boardCount"] as const;

export const MUNICIPALITY_NUMERIC_FIELDS: ReadonlyArray<
  MunicipalityFilter["field"]
> = ["boardCount"] as const;

export const MUNICIPALITY_NO_VALUE_OPERATORS: ReadonlySet<MunicipalityFilterOperator> =
  new Set(["isEmpty", "isNotEmpty"]);

export const MUNICIPALITY_FIELD_OPERATORS: Record<
  MunicipalityFilter["field"],
  ReadonlyArray<MunicipalityFilterOperator>
> = {
  code: [
    "contains",
    "equals",
    "=",
    "notEqual",
    "!=",
    "startsWith",
    "endsWith",
    "isEmpty",
    "isNotEmpty",
  ],
  name: [
    "contains",
    "equals",
    "=",
    "notEqual",
    "!=",
    "startsWith",
    "endsWith",
    "isEmpty",
    "isNotEmpty",
  ],
  prefecture: [
    "contains",
    "equals",
    "=",
    "notEqual",
    "!=",
    "startsWith",
    "endsWith",
    "isEmpty",
    "isNotEmpty",
  ],
  status: ["equals", "=", "notEqual", "!=", "isEmpty", "isNotEmpty"],
  boardCount: [
    "equals",
    "=",
    "notEqual",
    "!=",
    "greaterThan",
    "gt",
    ">",
    "greaterThanOrEqual",
    "gte",
    ">=",
    "lessThan",
    "lt",
    "<",
    "lessThanOrEqual",
    "lte",
    "<=",
    "isEmpty",
    "isNotEmpty",
  ],
};

export interface MunicipalityFilter {
  field: "code" | "name" | "prefecture" | "status" | "boardCount";
  operator?: MunicipalityFilterOperator;
  value?: string;
}

/**
 * 市区町村一覧取得時に利用できるソート／フィルタ条件。
 *
 * - `orderBy.field` と `filters[].field` は `MUNICIPALITY_FILTER_FIELDS` のいずれか。
 * - フィールドごとの許可演算子は `MUNICIPALITY_FIELD_OPERATORS` を参照。
 *   - `code`/`name`/`prefecture`: 部分一致（contains/startsWith/endsWith）と等価、空判定をサポート。
 *   - `status`: 等価 (`equals`/`=`)、不等 (`notEqual`/`!=`)、空判定のみ。
 *   - `boardCount`: 比較系 (`>`/`>=`/`<`/`<=`) と等価・不等、空判定をサポート。
 * - `filters[].value` は演算子が値を必要とする場合のみ指定し、空文字は無視されます。
 */
export interface FindMunicipalitiesOptions {
  skip?: number;
  take?: number;
  prefecture?: string;
  search?: string;
  status?: string;
  filters?: MunicipalityFilter[];
  orderBy?: {
    field: MunicipalityFilter["field"];
    direction: "asc" | "desc";
  };
}

export interface CountMunicipalitiesOptions {
  prefecture?: string;
  search?: string;
  status?: string;
  filters?: MunicipalityFilter[];
}

export interface GeoJSONFeature {
  type: "Feature";
  properties: {
    name: string;
    code: string;
    prefecture: string;
  };
  geometry: GeoJSON.Geometry;
}

export interface MunicipalityBoardRecord {
  id: string;
  boardNumber: string | null;
  name: string | null;
  address: string;
  longitude: number | null;
  latitude: number | null;
  status: BoardStatus;
  trustLevel: TrustLevel;
}

export interface IMunicipalityRepository {
  /**
   * IDで市区町村を検索
   */
  findById(id: string): Promise<Municipality | null>;

  /**
   * 行政区域コードで市区町村を検索
   */
  findByCode(code: string): Promise<Municipality | null>;

  /**
   * 市区町村の一覧を取得
   */
  findAll(options?: FindMunicipalitiesOptions): Promise<Municipality[]>;

  /**
   * 市区町村の件数を取得
   */
  count(options?: CountMunicipalitiesOptions): Promise<number>;

  /**
   * 市区町村をGeoJSON形式でエクスポート
   */
  exportAsGeoJSON(id: string): Promise<GeoJSONFeature | null>;

  /**
   * 市区町村を保存
   */
  save(municipality: Municipality): Promise<void>;

  /**
   * 市区町村に紐づく掲示場一覧を取得
   */
  findBoardsByMunicipalityId(
    municipalityId: string
  ): Promise<MunicipalityBoardRecord[]>;

  /**
   * 緯度経度から最も近い、または内包する自治体を検索
   */
  findNearestByCoordinates(input: {
    latitude: number;
    longitude: number;
  }): Promise<{
    municipality: Municipality;
    distanceMeters: number | null;
    isInside: boolean;
  } | null>;
}
