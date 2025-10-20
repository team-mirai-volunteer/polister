/**
 * Board Repository 実装
 */

import { BOARD_LOCATION_FETCH_LIMIT_MAX } from "@/features/board/domain/constants";
import {
  isBoardStatus,
  isTrustLevel,
} from "@/shared/domain/board/BoardAttributes";
import type { AppLogger } from "@/shared/lib/di/tokens";
import { TOKENS } from "@/shared/lib/di/tokens";
import { sanitizeLimit } from "@/shared/lib/validation/sanitizeLimit";
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
    const normalizedLimit = sanitizeLimit(options?.limit, {
      max: BOARD_LOCATION_FETCH_LIMIT_MAX,
    });

    const effectiveLimit = normalizedLimit ?? BOARD_LOCATION_FETCH_LIMIT_MAX;

    const limitClause = Prisma.sql`LIMIT ${effectiveLimit}`;

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
      ORDER BY created_at ASC, id ASC
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

        try {
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
        } catch (error) {
          this.logger.warn("[BoardRepository] Skip board: invalid data", {
            id: row.id,
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        }
      })
      .filter((item): item is BoardLocation => item !== null);
  }
}
