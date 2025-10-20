/**
 * システム統計情報取得 Server Action
 */

"use server";

import { setupDI } from "@/shared/lib/di/container";
import { container } from "tsyringe";

import { GetSystemMetricsUseCase } from "../usecases/GetSystemMetricsUseCase";

interface SystemMetricsResult {
  municipalities: number;
  boards: number;
  isFallback: boolean;
}

export async function getSystemMetricsAction(): Promise<SystemMetricsResult> {
  try {
    setupDI(container);

    const useCase = container.resolve(GetSystemMetricsUseCase);
    const metrics = await useCase.execute();

    return {
      municipalities: metrics.totalMunicipalities,
      boards: metrics.totalBoards,
      isFallback: false,
    };
  } catch (error) {
    console.error("Error in getSystemMetricsAction:", error);
    return {
      municipalities: 0,
      boards: 0,
      isFallback: true,
    };
  }
}
