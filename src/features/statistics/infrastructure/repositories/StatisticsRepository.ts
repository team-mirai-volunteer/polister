/**
 * Statistics Repository 実装
 */

import { TOKENS } from "@/shared/lib/di/tokens";
import type { PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";

import { SystemMetrics } from "../../domain/entities/SystemMetrics";
import type { IStatisticsRepository } from "../../domain/repositories/IStatisticsRepository";

@injectable()
export class StatisticsRepository implements IStatisticsRepository {
  constructor(
    @inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient
  ) {}

  async getSystemMetrics(): Promise<SystemMetrics> {
    const [municipalityCount, boardCount] = await Promise.all([
      this.prisma.municipality.count(),
      this.prisma.board.count({
        where: {
          deletedAt: null,
        },
      }),
    ]);

    return new SystemMetrics(municipalityCount, boardCount);
  }
}
