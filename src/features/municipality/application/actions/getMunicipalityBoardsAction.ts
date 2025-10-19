/**
 * 自治体掲示板一覧取得 Server Action
 */

"use server";

import { setupDI } from "@/shared/lib/di/container";
import { container } from "tsyringe";
import type { MunicipalityBoardDTO } from "../dto/MunicipalityBoardDTO";
import { GetMunicipalityBoardsUseCase } from "../usecases/GetMunicipalityBoardsUseCase";

export async function getMunicipalityBoardsAction(
  municipalityId: string
): Promise<MunicipalityBoardDTO[]> {
  try {
    const normalizedId = municipalityId.trim();
    if (normalizedId.length === 0) {
      throw new Error("municipalityId is required");
    }

    setupDI(container);

    const useCase = container.resolve(GetMunicipalityBoardsUseCase);
    return await useCase.execute(normalizedId);
  } catch (error) {
    console.error(
      `Error in getMunicipalityBoardsAction(${municipalityId}):`,
      error
    );
    throw new Error("自治体掲示板一覧の取得に失敗しました");
  }
}
