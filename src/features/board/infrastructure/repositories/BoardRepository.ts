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
  FindByLocationOptions,
  FindByMunicipalityOptions,
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

    if (!isBoardStatus(board.status)) {
      throw new Error(`Invalid board status: ${board.status}`);
    }

    if (!isTrustLevel(board.trustLevel)) {
      throw new Error(`Invalid trust level: ${board.trustLevel}`);
    }

    // 座標がnullの場合はnullのまま保持（デフォルト値で上書きしない）
    const coords =
      latitude !== null && longitude !== null
        ? new Coordinates({ latitude, longitude })
        : null;

    return new Board({
      id: board.id,
      boardNumber: board.boardNumber,
      name: board.name,
      address: new Address(board.address),
      coordinates: coords,
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

    // 座標が設定されている場合のみlocationを更新
    if (coordinates !== null) {
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
    } else {
      // 座標がnullの場合は通常のフィールドのみ更新
      await this.prisma.board.update({
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
      });
    }
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

  async findByLocation(
    options: FindByLocationOptions
  ): Promise<BoardLocation[]> {
    const { latitude, longitude, radiusMeters, limit = 50 } = options;

    // PostGIS空間検索（ST_DWithin）
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        board_number: string | null;
        name: string | null;
        address: string;
        municipality_id: string;
        municipality_name: string;
        municipality_prefecture: string;
        longitude: number;
        latitude: number;
        distance: number;
        status: PrismaBoardStatus;
        trust_level: PrismaTrustLevel;
      }>
    >(Prisma.sql`
      SELECT
        b.id,
        b.board_number,
        b.name,
        b.address,
        b.municipality_id,
        m.name AS municipality_name,
        m.prefecture AS municipality_prefecture,
        ST_X(b.location::geometry) AS longitude,
        ST_Y(b.location::geometry) AS latitude,
        ST_Distance(
          b.location::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude})::geometry, 4326)::geography
        ) AS distance,
        b.status,
        b.trust_level
      FROM boards b
      JOIN municipalities m ON b.municipality_id = m.id
      WHERE b.deleted_at IS NULL
        AND b.location IS NOT NULL
        AND ST_DWithin(
          b.location::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude})::geometry, 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY distance ASC
      LIMIT ${limit}
    `);

    return rows
      .map((row) => {
        if (!isBoardStatus(row.status)) return null;
        if (!isTrustLevel(row.trust_level)) return null;

        try {
          return new BoardLocation({
            id: row.id,
            boardNumber: row.board_number,
            name: row.name,
            address: row.address,
            municipalityId: row.municipality_id,
            municipalityName: row.municipality_name,
            municipalityPrefecture: row.municipality_prefecture,
            longitude: row.longitude,
            latitude: row.latitude,
            status: row.status,
            trustLevel: row.trust_level,
          });
        } catch (error) {
          this.logger.warn("[BoardRepository] Skip board: invalid data", {
            id: row.id,
            boardNumber: row.board_number,
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        }
      })
      .filter((item): item is BoardLocation => item !== null);
  }

  async findByMunicipality(
    options: FindByMunicipalityOptions
  ): Promise<BoardLocation[]> {
    const { prefecture, city, limit = 50 } = options;

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        board_number: string | null;
        name: string | null;
        address: string;
        municipality_id: string;
        municipality_name: string;
        municipality_prefecture: string;
        longitude: number | null;
        latitude: number | null;
        status: PrismaBoardStatus;
        trust_level: PrismaTrustLevel;
      }>
    >(Prisma.sql`
      SELECT
        b.id,
        b.board_number,
        b.name,
        b.address,
        b.municipality_id,
        m.name AS municipality_name,
        m.prefecture AS municipality_prefecture,
        ST_X(b.location::geometry) AS longitude,
        ST_Y(b.location::geometry) AS latitude,
        b.status,
        b.trust_level
      FROM boards b
      JOIN municipalities m ON b.municipality_id = m.id
      WHERE b.deleted_at IS NULL
        AND b.location IS NOT NULL
        AND m.prefecture = ${prefecture}
        AND m.name = ${city}
      ORDER BY b.created_at DESC
      LIMIT ${limit}
    `);

    return rows
      .map((row) => {
        if (!isBoardStatus(row.status)) return null;
        if (!isTrustLevel(row.trust_level)) return null;

        try {
          return new BoardLocation({
            id: row.id,
            boardNumber: row.board_number,
            name: row.name,
            address: row.address,
            municipalityId: row.municipality_id,
            municipalityName: row.municipality_name,
            municipalityPrefecture: row.municipality_prefecture,
            longitude: row.longitude,
            latitude: row.latitude,
            status: row.status,
            trustLevel: row.trust_level,
          });
        } catch (error) {
          this.logger.warn("[BoardRepository] Skip board: invalid data", {
            id: row.id,
            boardNumber: row.board_number,
            address: row.address,
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        }
      })
      .filter((item): item is BoardLocation => item !== null);
  }
}
