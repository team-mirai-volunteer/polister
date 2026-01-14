/**
 * 自治体詳細取得 Server Action
 */

"use server";

import { setupDI } from "@/shared/lib/di/container";
import { logger } from "@/shared/logging/logger";
import { container } from "tsyringe";
import { MunicipalityMapper } from "../../infrastructure/mappers/MunicipalityMapper";
import { GetMunicipalityByIdUseCase } from "../usecases/GetMunicipalityByIdUseCase";

export async function getMunicipalityByIdAction(id: string) {
  try {
    // DIコンテナをセットアップ
    setupDI(container);

    const useCase = container.resolve(GetMunicipalityByIdUseCase);
    const municipality = await useCase.execute(id);

    if (!municipality) {
      return null;
    }

    // DTOに変換して返す
    return MunicipalityMapper.toDTO(municipality);
  } catch (error) {
    logger.error(`Error in getMunicipalityByIdAction(${id}):`, error);
    throw new Error("自治体詳細の取得に失敗しました");
  }
}
