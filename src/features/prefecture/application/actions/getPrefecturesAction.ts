/**
 * 都道府県一覧取得 Server Action
 */

"use server";

import { setupDI } from "@/shared/lib/di/container";
import { container } from "tsyringe";

import { PrefectureMapper } from "../../infrastructure/mappers/PrefectureMapper";
import { GetPrefecturesUseCase } from "../usecases/GetPrefecturesUseCase";

export async function getPrefecturesAction() {
  try {
    setupDI(container);

    const useCase = container.resolve(GetPrefecturesUseCase);
    const prefectures = await useCase.execute();

    return prefectures.map((prefecture) => PrefectureMapper.toDTO(prefecture));
  } catch (error) {
    console.error("Error in getPrefecturesAction:", error);
    throw new Error("都道府県一覧の取得に失敗しました", { cause: error });
  }
}
