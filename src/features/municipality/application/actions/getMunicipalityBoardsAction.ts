/**
 * 自治体掲示板一覧取得 Server Action
 */

"use server";

import { setupDI } from "@/shared/lib/di/container";
import type { MunicipalityBoardDTO } from "../dto/MunicipalityBoardDTO";
import { GetMunicipalityBoardsUseCase } from "../usecases/GetMunicipalityBoardsUseCase";
import { container } from "tsyringe";

export async function getMunicipalityBoardsAction(
  municipalityId: string
): Promise<MunicipalityBoardDTO[]> {
  setupDI(container);

  const useCase = container.resolve(GetMunicipalityBoardsUseCase);
  return await useCase.execute(municipalityId);
}
