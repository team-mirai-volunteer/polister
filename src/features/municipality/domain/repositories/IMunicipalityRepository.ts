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

export interface MunicipalityFilter {
  field: "code" | "name" | "prefecture" | "status" | "boardCount";
  operator?: MunicipalityFilterOperator;
  value?: string;
}

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
  boardNumber: number | null;
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
   * 市区町村に紐づく掲示板一覧を取得
   */
  findBoardsByMunicipalityId(
    municipalityId: string
  ): Promise<MunicipalityBoardRecord[]>;
}
