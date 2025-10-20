/**
 * システム統計情報取得 Server Action
 */

"use server";

import { setupDI } from "@/shared/lib/di/container";
import { container } from "tsyringe";

import { GetSystemMetricsUseCase } from "../usecases/GetSystemMetricsUseCase";

export async function getSystemMetricsAction() {
  try {
    setupDI(container);

    const useCase = container.resolve(GetSystemMetricsUseCase);
    const metrics = await useCase.execute();

    return {
      municipalities: metrics.totalMunicipalities,
      boards: metrics.totalBoards,
    };
  } catch (error) {
    console.error("Error in getSystemMetricsAction:", error);
    throw new Error("統計情報の取得に失敗しました", { cause: error });
  }
}
