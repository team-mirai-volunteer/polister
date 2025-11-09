/**
 * Board Repository 実装
 */

import { Board } from "@/features/board/domain/aggregates/Board";
import { BOARD_LOCATION_FETCH_LIMIT_MAX } from "@/features/board/domain/constants";
import { Address } from "@/shared/domain/board/Address";
import {
  isBoardStatus,
  isTrustLevel,
} from "@/shared/domain/board/BoardAttributes";
import { Coordinates } from "@/shared/domain/board/Coordinates";
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
        board_number: string | null;
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

  async findById(id: string): Promise<Board | null> {
    // 基本フィールドはPrismaの型安全なメソッドで取得
    // deletedAtは非unique制約のため、findFirstを使用
    const board = await this.prisma.board.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!board) {
      return null;
    }

    // PostGISの座標を取得（location IS NULLの場合も許可）
    const coordinates = await this.prisma.$queryRaw<
      Array<{
        longitude: number | null;
        latitude: number | null;
      }>
    >(Prisma.sql`
      SELECT
        ST_X(location::geometry) AS longitude,
        ST_Y(location::geometry) AS latitude
      FROM boards
      WHERE id = ${id}
    `);

    if (coordinates.length === 0) {
      return null;
    }

    const { latitude, longitude } = coordinates[0];

    // 座標がない場合はデフォルト値（東京駅）を使用
    const validLatitude = latitude ?? 35.6812;
    const validLongitude = longitude ?? 139.7671;

    if (!isBoardStatus(board.status)) {
      throw new Error(`Invalid board status: ${board.status}`);
    }

    if (!isTrustLevel(board.trustLevel)) {
      throw new Error(`Invalid trust level: ${board.trustLevel}`);
    }

    return new Board({
      id: board.id,
      boardNumber: board.boardNumber,
      name: board.name,
      address: new Address(board.address),
      coordinates: new Coordinates({
        latitude: validLatitude,
        longitude: validLongitude,
      }),
      municipalityId: board.municipalityId,
      trustLevel: board.trustLevel,
      status: board.status,
      note: board.note,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    });
  }

  async update(board: Board): Promise<void> {
    const coordinates = board.coordinates;

    // トランザクションで実行
    await this.prisma.$transaction([
      // 通常のフィールドはPrismaのメソッドで型安全に更新
      this.prisma.board.update({
        where: { id: board.id },
        data: {
          boardNumber: board.boardNumber,
          name: board.name,
          address: board.address.value,
          status: board.status,
          trustLevel: board.trustLevel,
          note: board.note,
          updatedAt: board.updatedAt,
        },
      }),
      // PostGISのlocationフィールドのみ生SQLで更新
      this.prisma.$executeRaw`
        UPDATE boards
        SET location = ST_GeogFromText(${coordinates.toWKT()})
        WHERE id = ${board.id}
      `,
    ]);
  }

  async existsByBoardNumberInMunicipality(
    municipalityId: string,
    boardNumber: string,
    excludeBoardId?: string
  ): Promise<boolean> {
    const count = await this.prisma.board.count({
      where: {
        municipalityId,
        boardNumber,
        deletedAt: null,
        ...(excludeBoardId && { id: { not: excludeBoardId } }),
      },
    });

    return count > 0;
  }
}
