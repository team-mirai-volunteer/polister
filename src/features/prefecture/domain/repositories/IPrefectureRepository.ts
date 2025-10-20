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

export const PREFECTURE_NUMERIC_FIELDS: ReadonlyArray<
  PrefectureFilter["field"]
> = [
  "municipalityCount",
  "completedMunicipalityCount",
  "completionRate",
  "totalBoardCount",
] as const;

export const PREFECTURE_NO_VALUE_OPERATORS: ReadonlySet<PrefectureFilterOperator> =
  new Set(["isEmpty", "isNotEmpty"]);

export const PREFECTURE_FIELD_OPERATORS: Record<
  PrefectureFilter["field"],
  ReadonlyArray<PrefectureFilterOperator>
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
  municipalityCount: [
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
  completedMunicipalityCount: [
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
  completionRate: [
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
  totalBoardCount: [
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

/**
 * 都道府県一覧フィルタ条件。
 *
 * - `field` は `PREFECTURE_FILTER_FIELDS` に含まれる項目のみ指定可能。
 * - フィールドごとの許可オペレータは `PREFECTURE_FIELD_OPERATORS` を参照。
 *   - `code`/`name`: `equals`/`=`、`notEqual`/`!=`、`contains`、`startsWith`、`endsWith`、`isEmpty`、`isNotEmpty`
 *   - `municipalityCount`/`completedMunicipalityCount`/`completionRate`/`totalBoardCount`:
 *     `equals`/`=`、`notEqual`/`!=`、比較演算子（`>`/`>=`/`<`/`<=` 由来の各エイリアス）、`isEmpty`、`isNotEmpty`
 * - `value` は値が必要なオペレータのみに指定し、数値フィールドでは数値文字列を想定します。
 *   `isEmpty`/`isNotEmpty` の場合は未指定でも構いません（`null` を空として判定）。
 */
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
