/**
 * 都道府県一覧取得 Server Action
 */

"use server";

import { setupDI } from "@/shared/lib/di/container";
import { container } from "tsyringe";

import { PrefectureMapper } from "../../infrastructure/mappers/PrefectureMapper";
import {
  GetPrefecturesUseCase,
  type GetPrefecturesInput,
} from "../usecases/GetPrefecturesUseCase";
import {
  PREFECTURE_FILTER_FIELDS,
  type PrefectureFilterOperator,
} from "../../domain/repositories/IPrefectureRepository";
import type { PrefectureFilter } from "../../domain/repositories/IPrefectureRepository";

export interface GetPrefecturesParams {
  sortField?: string;
  sortOrder?: "asc" | "desc";
  filterField?: string;
  filterOperator?: string;
  filterValue?: string;
}

type PrefectureField = NonNullable<GetPrefecturesInput["sortField"]>;

const PREFECTURE_FIELDS = new Set<PrefectureField>(
  PREFECTURE_FILTER_FIELDS as PrefectureField[]
);

function isPrefectureField(
  value: string | undefined
): value is PrefectureField {
  return Boolean(value && PREFECTURE_FIELDS.has(value as PrefectureField));
}

function normalizeOperator(
  operator: string | undefined,
  field: PrefectureFilter["field"]
): PrefectureFilterOperator | undefined {
  if (!operator) {
    return undefined;
  }

  const stringOperators: PrefectureFilterOperator[] = [
    "equals",
    "=",
    "notEqual",
    "!=",
    "contains",
    "startsWith",
    "endsWith",
    "isEmpty",
    "isNotEmpty",
  ];

  const numericOperators: PrefectureFilterOperator[] = [
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
  ];

  const allowed =
    field === "completionRate" || field === "totalBoardCount"
      ? numericOperators
      : stringOperators;

  return allowed.includes(operator as PrefectureFilterOperator)
    ? (operator as PrefectureFilterOperator)
    : undefined;
}

function buildFilters(params: GetPrefecturesParams) {
  if (!params.filterField) {
    return undefined;
  }

  if (!isPrefectureField(params.filterField)) {
    return undefined;
  }

  const operator = normalizeOperator(params.filterOperator, params.filterField);
  const value = params.filterValue ?? "";

  if (!operator) {
    return undefined;
  }

  const hasValue = value !== "";

  if (!hasValue && operator !== "isEmpty" && operator !== "isNotEmpty") {
    return undefined;
  }

  return [
    {
      field: params.filterField,
      operator,
      value: hasValue ? value : undefined,
    },
  ];
}

export async function getPrefecturesAction(params: GetPrefecturesParams = {}) {
  try {
    setupDI(container);

    const useCase = container.resolve(GetPrefecturesUseCase);
    const sortField = isPrefectureField(params.sortField)
      ? params.sortField
      : undefined;

    const sortOrder =
      params.sortOrder === "desc"
        ? "desc"
        : params.sortOrder === "asc"
          ? "asc"
          : undefined;

    const filters = buildFilters(params);

    const prefectures = await useCase.execute({
      sortField,
      sortOrder,
      filters,
    });

    return prefectures.map((prefecture) => PrefectureMapper.toDTO(prefecture));
  } catch (error) {
    console.error("Error in getPrefecturesAction:", error);
    throw new Error("都道府県一覧の取得に失敗しました", { cause: error });
  }
}
