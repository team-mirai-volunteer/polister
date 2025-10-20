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

export interface GetPrefecturesParams {
  sortField?: string;
  sortOrder?: "asc" | "desc";
  filterField?: string;
  filterOperator?: string;
  filterValue?: string;
}

type PrefectureField = NonNullable<GetPrefecturesInput["sortField"]>;

const PREFECTURE_FIELDS = new Set<PrefectureField>([
  "code",
  "name",
  "municipalityCount",
  "completedMunicipalityCount",
  "completionRate",
  "totalBoardCount",
]);

function isPrefectureField(
  value: string | undefined
): value is PrefectureField {
  return Boolean(value && PREFECTURE_FIELDS.has(value as PrefectureField));
}

function buildFilters(params: GetPrefecturesParams) {
  if (!params.filterField) {
    return undefined;
  }

  if (!isPrefectureField(params.filterField)) {
    return undefined;
  }

  const operator = params.filterOperator;
  const value = params.filterValue ?? "";

  if (!value && operator !== "isEmpty" && operator !== "isNotEmpty") {
    return undefined;
  }

  return [
    {
      field: params.filterField,
      operator,
      value,
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
