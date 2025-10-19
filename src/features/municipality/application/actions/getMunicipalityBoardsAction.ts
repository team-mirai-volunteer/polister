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
  setupDI(container);

  const useCase = container.resolve(GetMunicipalityBoardsUseCase);
  return await useCase.execute(municipalityId);
}
