/**
 * Prefecture Repository インターフェース
 *
 * 都道府県単位の集計・詳細情報を提供するリポジトリインターフェース
 */

import type { MunicipalityBoardRecord } from "@/features/municipality/domain/repositories/IMunicipalityRepository";
import type { Prefecture } from "../entities/Prefecture";
import type { PrefectureDetail } from "../entities/PrefectureDetail";

export const PREFECTURE_FILTER_OPERATORS = [
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
  "contains",
  "startsWith",
  "endsWith",
  "isEmpty",
  "isNotEmpty",
] as const;

export type PrefectureFilterOperator =
  (typeof PREFECTURE_FILTER_OPERATORS)[number];

export const PREFECTURE_FILTER_FIELDS: ReadonlyArray<
  PrefectureFilter["field"]
> = [
  "code",
  "name",
  "municipalityCount",
  "completedMunicipalityCount",
  "completionRate",
  "totalBoardCount",
] as const;

export interface PrefectureFilter {
  field:
    | "code"
    | "name"
    | "municipalityCount"
    | "completedMunicipalityCount"
    | "completionRate"
    | "totalBoardCount";
  operator?: PrefectureFilterOperator;
  value?: string;
}

export interface FindPrefecturesOptions {
  filters?: PrefectureFilter[];
  sortField?: PrefectureFilter["field"];
  sortOrder?: "asc" | "desc";
}

export interface IPrefectureRepository {
  /**
   * 都道府県の一覧を集計情報付きで取得
   */
  findAll(options?: FindPrefecturesOptions): Promise<Prefecture[]>;

  /**
   * 都道府県コードから詳細情報を取得
   */
  findByCode(code: string): Promise<PrefectureDetail | null>;

  /**
   * 都道府県配下の掲示板一覧を取得
   */
  findBoardsByPrefectureCode(code: string): Promise<MunicipalityBoardRecord[]>;
}
