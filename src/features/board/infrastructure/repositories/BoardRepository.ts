/**
 * Board Repository 実装
 */

import {
  isBoardStatus,
  isTrustLevel,
} from "@/features/municipality/domain/value-objects/BoardAttributes";
import type { AppLogger } from "@/shared/lib/di/tokens";
import { TOKENS } from "@/shared/lib/di/tokens";
import type {
  BoardStatus as PrismaBoardStatus,
  PrismaClient,
  TrustLevel as PrismaTrustLevel,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { inject, injectable } from "tsyringe";

import { BoardLocation } from "../../domain/entities/BoardLocation";
import type {
  FindBoardLocationsOptions,
  IBoardRepository,
} from "../../domain/repositories/IBoardRepository";

@injectable()
export class BoardRepository implements IBoardRepository {
  constructor(
    @inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient,
    @inject(TOKENS.Logger) private readonly logger: AppLogger
  ) {}

  async findAllWithLocation(
    options?: FindBoardLocationsOptions
  ): Promise<BoardLocation[]> {
    const rawLimit = options?.limit;
    const normalizedLimit =
      typeof rawLimit === "number" && Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.max(Math.floor(rawLimit), 1)
        : undefined;

    const limitClause = normalizedLimit
      ? Prisma.sql`LIMIT ${normalizedLimit}`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        board_number: number | null;
        name: string | null;
        address: string;
        longitude: number | null;
        latitude: number | null;
        status: PrismaBoardStatus;
        trust_level: PrismaTrustLevel;
      }>
    >(Prisma.sql`
      SELECT
        id,
        board_number,
        name,
        address,
        ST_X(location::geometry) AS longitude,
        ST_Y(location::geometry) AS latitude,
        status,
        trust_level
      FROM boards
      WHERE deleted_at IS NULL
        AND location IS NOT NULL
      ORDER BY created_at ASC
      ${limitClause}
    `);

    return rows
      .map((row) => {
        if (!isBoardStatus(row.status)) {
          this.logger.warn("[BoardRepository] Skip board: invalid status", {
            id: row.id,
            status: row.status,
          });
          return null;
        }

        if (!isTrustLevel(row.trust_level)) {
          this.logger.warn(
            "[BoardRepository] Skip board: invalid trust level",
            {
              id: row.id,
              trustLevel: row.trust_level,
            }
          );
          return null;
        }

        return new BoardLocation({
          id: row.id,
          boardNumber: row.board_number,
          name: row.name,
          address: row.address,
          longitude: row.longitude,
          latitude: row.latitude,
          status: row.status,
          trustLevel: row.trust_level,
        });
      })
      .filter((item): item is BoardLocation => item !== null);
  }
}
