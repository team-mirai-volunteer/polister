/**
 * Municipality Repository実装
 *
 * Prismaを使用した市区町村データの永続化実装
 */

import { TOKENS } from "@/shared/lib/di/tokens";
import type { PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";
import type { BoardStatus, TrustLevel } from "@prisma/client";

import type { Municipality } from "../../domain/entities/Municipality";
import type {
  CountMunicipalitiesOptions,
  FindMunicipalitiesOptions,
  GeoJSONFeature,
  MunicipalityBoardRecord,
  IMunicipalityRepository,
} from "../../domain/repositories/IMunicipalityRepository";
import { MunicipalityMapper } from "../mappers/MunicipalityMapper";

@injectable()
export class MunicipalityRepository implements IMunicipalityRepository {
  constructor(@inject(TOKENS.PrismaClient) private prisma: PrismaClient) {}

  async findById(id: string): Promise<Municipality | null> {
    const data = await this.prisma.municipality.findUnique({
      where: { id },
    });

    return data ? MunicipalityMapper.toDomain(data) : null;
  }

  async findByCode(code: string): Promise<Municipality | null> {
    const data = await this.prisma.municipality.findUnique({
      where: { code },
    });

    return data ? MunicipalityMapper.toDomain(data) : null;
  }

  async findAll(options?: FindMunicipalitiesOptions): Promise<Municipality[]> {
    const whereClause = this.buildWhereClause(options);

    const municipalities = await this.prisma.municipality.findMany({
      where: whereClause,
      skip: options?.skip,
      take: options?.take || 50,
      orderBy: { code: "asc" },
    });

    return municipalities.map(MunicipalityMapper.toDomain);
  }

  async count(options?: CountMunicipalitiesOptions): Promise<number> {
    const whereClause = this.buildWhereClause(options);

    return await this.prisma.municipality.count({
      where: whereClause,
    });
  }

  async exportAsGeoJSON(id: string): Promise<GeoJSONFeature | null> {
    const result = await this.prisma.$queryRaw<
      Array<{
        geojson: string;
        name: string;
        code: string;
        prefecture: string;
      }>
    >`
      SELECT
        ST_AsGeoJSON(polygon::geometry) as geojson,
        name,
        code,
        prefecture
      FROM municipalities
      WHERE id = ${id}
        AND polygon IS NOT NULL
    `;

    if (result.length === 0) return null;

    const row = result[0];

    return {
      type: "Feature",
      properties: {
        name: row.name,
        code: row.code,
        prefecture: row.prefecture,
      },
      geometry: JSON.parse(row.geojson) as GeoJSON.Geometry,
    };
  }

  async save(municipality: Municipality): Promise<void> {
    const data = MunicipalityMapper.toPrisma(municipality);

    await this.prisma.municipality.update({
      where: { id: municipality.id },
      data,
    });
  }

  async findBoardsByMunicipalityId(
    municipalityId: string
  ): Promise<MunicipalityBoardRecord[]> {
    const rows = await this.prisma.$queryRaw<Array<
      {
        id: string;
        board_number: number | null;
        name: string | null;
        address: string;
        longitude: number | null;
        latitude: number | null;
        status: BoardStatus;
        trust_level: TrustLevel;
      }
    >>`
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
      WHERE municipality_id = ${municipalityId}
        AND deleted_at IS NULL
      ORDER BY board_number ASC NULLS LAST, created_at ASC
    `;

    return rows.map((row) => ({
      id: row.id,
      boardNumber:
        row.board_number !== null && row.board_number !== undefined
          ? Number(row.board_number)
          : null,
      name: row.name,
      address: row.address,
      longitude:
        row.longitude !== null && row.longitude !== undefined
          ? Number(row.longitude)
          : null,
      latitude:
        row.latitude !== null && row.latitude !== undefined
          ? Number(row.latitude)
          : null,
      status: row.status,
      trustLevel: row.trust_level,
    }));
  }

  /**
   * WHERE句を構築
   */
  private buildWhereClause(
    options?: FindMunicipalitiesOptions | CountMunicipalitiesOptions
  ): object {
    const where: {
      prefecture?: string;
      status?: string;
      OR?: Array<{
        name?: { contains: string };
        prefecture?: { contains: string };
      }>;
    } = {};

    if (options?.prefecture) {
      where.prefecture = options.prefecture;
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search } },
        { prefecture: { contains: options.search } },
      ];
    }

    return where;
  }
}
