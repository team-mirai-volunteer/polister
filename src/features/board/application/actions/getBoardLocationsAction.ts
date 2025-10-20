/**
 * 掲示板位置情報取得 Server Action
 */

"use server";

import { setupDI } from "@/shared/lib/di/container";
import { container } from "tsyringe";

import {
  GetBoardLocationsUseCase,
  type GetBoardLocationsInput,
} from "../usecases/GetBoardLocationsUseCase";

export async function getBoardLocationsAction(
  input: GetBoardLocationsInput = {}
) {
  try {
    setupDI(container);

    const useCase = container.resolve(GetBoardLocationsUseCase);
    return await useCase.execute(input);
  } catch (error) {
    console.error("Error in getBoardLocationsAction:", error);
    throw new Error("掲示板位置情報の取得に失敗しました", { cause: error });
  }
}
