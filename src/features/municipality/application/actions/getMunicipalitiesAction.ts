/**
 * 自治体一覧取得 Server Action
 */

"use server";

import { setupDI } from "@/shared/lib/di/container";
import { container } from "tsyringe";
import {
  MUNICIPALITY_FIELD_OPERATORS,
  MUNICIPALITY_FILTER_FIELDS,
  type MunicipalityFilter,
  type MunicipalityFilterOperator,
} from "../../domain/repositories/IMunicipalityRepository";
import { MunicipalityMapper } from "../../infrastructure/mappers/MunicipalityMapper";
import { GetMunicipalitiesUseCase } from "../usecases/GetMunicipalitiesUseCase";

export interface GetMunicipalitiesParams {
  page?: number;
  limit?: number;
  prefecture?: string;
  search?: string;
  status?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  filterField?: string;
  filterOperator?: string;
  filterValue?: string;
}

export async function getMunicipalitiesAction(
  params: GetMunicipalitiesParams = {}
) {
  try {
    // DIコンテナをセットアップ
    setupDI(container);

    const useCase = container.resolve(GetMunicipalitiesUseCase);
    const normalizeField = (
      value: string | undefined
    ): MunicipalityFilter["field"] | undefined => {
      const allowed = new Set<MunicipalityFilter["field"]>(
        MUNICIPALITY_FILTER_FIELDS
      );
      return value && allowed.has(value as MunicipalityFilter["field"])
        ? (value as MunicipalityFilter["field"])
        : undefined;
    };

    const normalizeOperator = (
      value: string | undefined,
      field: MunicipalityFilter["field"] | undefined
    ): MunicipalityFilterOperator | undefined => {
      if (!value || !field) {
        return undefined;
      }

      const allowedOperators = MUNICIPALITY_FIELD_OPERATORS[field];

      return allowedOperators.includes(value as MunicipalityFilterOperator)
        ? (value as MunicipalityFilterOperator)
        : undefined;
    };

    const sortField = normalizeField(params.sortField);
    const filterField = normalizeField(params.filterField);
    const filterOperator = normalizeOperator(
      params.filterOperator,
      filterField
    );

    const result = await useCase.execute({
      page: params.page,
      limit: params.limit,
      prefecture: params.prefecture,
      search: params.search,
      status: params.status,
      sortField,
      sortOrder:
        params.sortOrder === "desc"
          ? "desc"
          : params.sortOrder === "asc"
            ? "asc"
            : undefined,
      filterField,
      filterOperator,
      filterValue: params.filterValue ?? "",
    });

    // DTOに変換して返す
    return {
      municipalities: result.municipalities.map(MunicipalityMapper.toDTO),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      limit: result.limit,
    };
  } catch (error) {
    console.error("Error in getMunicipalitiesAction:", error);
    throw new Error("自治体一覧の取得に失敗しました");
  }
}
