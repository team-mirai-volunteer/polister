/**
 * システム統計情報取得 Server Action
 */

"use server";

import { setupDI } from "@/shared/lib/di/container";
import { logger } from "@/shared/logging/logger";
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Error in getSystemMetricsAction:", {
        message: error.message,
        stack: error.stack,
      });
    } else {
      logger.error("Error in getSystemMetricsAction:", error);
    }
    return {
      municipalities: 0,
      boards: 0,
      isFallback: true,
    };
  }
}
