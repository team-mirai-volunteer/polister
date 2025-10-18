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
}

export async function getMunicipalitiesAction(
  params: GetMunicipalitiesParams = {}
) {
  try {
    // DIコンテナをセットアップ
    setupDI(container);

    const useCase = container.resolve(GetMunicipalitiesUseCase);
    const result = await useCase.execute(params);

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
