/**
 * GetSystemMetricsUseCase
 *
 * システム統計情報を取得するユースケース
 */

import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";

import type { SystemMetrics } from "../../domain/entities/SystemMetrics";
import type { IStatisticsRepository } from "../../domain/repositories/IStatisticsRepository";

@injectable()
export class GetSystemMetricsUseCase {
  constructor(
    @inject(TOKENS.StatisticsRepository)
    private readonly repository: IStatisticsRepository
  ) {}

  async execute(): Promise<SystemMetrics> {
    return this.repository.getSystemMetrics();
  }
}
