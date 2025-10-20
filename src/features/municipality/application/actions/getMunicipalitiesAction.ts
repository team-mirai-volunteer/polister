/**
 * 自治体一覧取得 Server Action
 */

"use server";

import { setupDI } from "@/shared/lib/di/container";
import { container } from "tsyringe";
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
    const normalizeField = (value: string | undefined) => {
      const allowed = new Set([
        "code",
        "name",
        "prefecture",
        "status",
        "boardCount",
      ]);
      return value && allowed.has(value) ? value : undefined;
    };

    const sortField = normalizeField(params.sortField);
    const filterField = normalizeField(params.filterField);

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
      filterOperator: params.filterOperator,
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
