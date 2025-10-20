/**
 * 都道府県詳細取得 Server Action
 */

"use server";

import { setupDI } from "@/shared/lib/di/container";
import { container } from "tsyringe";

import { PrefectureMapper } from "../../infrastructure/mappers/PrefectureMapper";
import { GetPrefectureByCodeUseCase } from "../usecases/GetPrefectureByCodeUseCase";

export async function getPrefectureByCodeAction(code: string) {
  try {
    setupDI(container);

    const useCase = container.resolve(GetPrefectureByCodeUseCase);
    const prefecture = await useCase.execute(code);

    if (!prefecture) {
      return null;
    }

    return PrefectureMapper.toDetailDTO(prefecture);
  } catch (error) {
    console.error("Error in getPrefectureByCodeAction:", error);
    throw new Error("都道府県詳細の取得に失敗しました");
  }
}
