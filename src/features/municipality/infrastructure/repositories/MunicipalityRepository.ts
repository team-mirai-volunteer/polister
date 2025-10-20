/**
 * Municipality Repository実装
 *
 * Prismaを使用した市区町村データの永続化実装
 */

import { TOKENS } from "@/shared/lib/di/tokens";
import type {
  Prisma,
  BoardStatus as PrismaBoardStatus,
  PrismaClient,
  MunicipalityStatus as PrismaMunicipalityStatus,
  TrustLevel as PrismaTrustLevel,
} from "@prisma/client";
import { MunicipalityStatus } from "@prisma/client";
import { inject, injectable } from "tsyringe";

import type { Municipality } from "../../domain/entities/Municipality";
import type {
  CountMunicipalitiesOptions,
  FindMunicipalitiesOptions,
  GeoJSONFeature,
  IMunicipalityRepository,
  MunicipalityBoardRecord,
  MunicipalityFilter,
} from "../../domain/repositories/IMunicipalityRepository";
import {
  isBoardStatus,
  isTrustLevel,
  type BoardStatus,
  type TrustLevel,
} from "../../domain/value-objects/BoardAttributes";
import { MunicipalityMapper } from "../mappers/MunicipalityMapper";

@injectable()
export class MunicipalityRepository implements IMunicipalityRepository {
  constructor(@inject(TOKENS.PrismaClient) private prisma: PrismaClient) {}

  async findById(id: string): Promise<Municipality | null> {
    const data = await this.prisma.municipality.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            boards: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    return data ? MunicipalityMapper.toDomain(data) : null;
  }

  async findByCode(code: string): Promise<Municipality | null> {
    const data = await this.prisma.municipality.findUnique({
      where: { code },
      include: {
        _count: {
          select: {
            boards: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    return data ? MunicipalityMapper.toDomain(data) : null;
  }

  async findAll(options?: FindMunicipalitiesOptions): Promise<Municipality[]> {
    const { filters, boardCountFilter } = this.partitionBoardCountFilter(
      options?.filters
    );

    const baseOptions: FindMunicipalitiesOptions = {
      ...options,
      filters,
    };

    const baseWhere = this.buildWhereClause(baseOptions);
    const orderBy = this.buildOrderBy(baseOptions);

    const effectiveWhere = await this.applyBoardCountFilterToWhere(
      baseWhere,
      boardCountFilter
    );

    if (effectiveWhere === null) {
      return [];
    }

    const orderByField = options?.orderBy?.field;

    if (orderByField === "boardCount") {
      const sortedIds = await this.getMunicipalityIdsSortedByBoardCount(
        effectiveWhere,
        options?.orderBy?.direction === "desc" ? "desc" : "asc"
      );

      if (sortedIds.length === 0) {
        return [];
      }

      const skip = options?.skip ?? 0;
      const take = options?.take ?? 50;
      const pageIds = sortedIds.slice(skip, skip + take);

      if (pageIds.length === 0) {
        return [];
      }

      const municipalities = await this.prisma.municipality.findMany({
        where: {
          ...effectiveWhere,
          id: {
            in: pageIds,
          },
        },
        include: {
          _count: {
            select: {
              boards: {
                where: {
                  deletedAt: null,
                },
              },
            },
          },
        },
      });

      const orderLookup = new Map(pageIds.map((id, index) => [id, index]));

      const ordered = municipalities.sort((a, b) => {
        const left = orderLookup.get(a.id) ?? 0;
        const right = orderLookup.get(b.id) ?? 0;
        return left - right;
      });

      return ordered.map(MunicipalityMapper.toDomain);
    }

    const municipalities = await this.prisma.municipality.findMany({
      where: effectiveWhere,
      skip: options?.skip,
      take: options?.take || 50,
      orderBy,
      include: {
        _count: {
          select: {
            boards: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    return municipalities.map(MunicipalityMapper.toDomain);
  }

  async count(options?: CountMunicipalitiesOptions): Promise<number> {
    const { filters, boardCountFilter } = this.partitionBoardCountFilter(
      options?.filters
    );

    const baseWhere = this.buildWhereClause({
      ...options,
      filters,
    });

    const effectiveWhere = await this.applyBoardCountFilterToWhere(
      baseWhere,
      boardCountFilter
    );

    if (effectiveWhere === null) {
      return 0;
    }

    return await this.prisma.municipality.count({
      where: effectiveWhere,
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
    >`
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

    return rows
      .map((row) => {
        const statusCandidate = row.status;
        const trustLevelCandidate = row.trust_level;

        if (!isBoardStatus(statusCandidate)) {
          console.warn("[MunicipalityRepository] Skip row: invalid status", {
            id: row.id,
            status: statusCandidate,
          });
          return null;
        }

        if (!isTrustLevel(trustLevelCandidate)) {
          console.warn(
            "[MunicipalityRepository] Skip row: invalid trust level",
            {
              id: row.id,
              trustLevel: trustLevelCandidate,
            }
          );
          return null;
        }

        const status: BoardStatus = statusCandidate;
        const trustLevel: TrustLevel = trustLevelCandidate;

        return {
          id: row.id,
          boardNumber:
            row.board_number !== null ? Number(row.board_number) : null,
          name: row.name,
          address: row.address,
          longitude: row.longitude !== null ? Number(row.longitude) : null,
          latitude: row.latitude !== null ? Number(row.latitude) : null,
          status,
          trustLevel,
        };
      })
      .filter((item): item is MunicipalityBoardRecord => item !== null);
  }

  /**
   * WHERE句を構築
   */
  private buildWhereClause(
    options?: FindMunicipalitiesOptions | CountMunicipalitiesOptions
  ): Prisma.MunicipalityWhereInput {
    const where: Prisma.MunicipalityWhereInput = {};

    if (options?.prefecture) {
      where.prefecture = options.prefecture;
    }

    if (options?.status && this.isMunicipalityStatusValue(options.status)) {
      where.status = options.status as PrismaMunicipalityStatus;
    }

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { prefecture: { contains: options.search, mode: "insensitive" } },
      ];
    }

    if (options && "filters" in options && options.filters) {
      for (const filter of options.filters) {
        if (!this.isValidFilter(filter)) {
          continue;
        }

        switch (filter.field) {
          case "code":
            where.code = this.buildStringFilter(filter.operator, filter.value);
            break;
          case "name":
            where.name = this.buildStringFilter(filter.operator, filter.value);
            break;
          case "prefecture":
            where.prefecture = this.buildStringFilter(
              filter.operator,
              filter.value
            );
            break;
          case "status":
            if (filter.value && this.isMunicipalityStatusValue(filter.value)) {
              where.status = filter.value as PrismaMunicipalityStatus;
            }
            break;
          case "boardCount":
            // boardCount filtering is handled separately to keep consistency with
            // relation-based counts. Skip here.
            break;
        }
      }
    }

    return where;
  }

  private partitionBoardCountFilter(filters?: MunicipalityFilter[]) {
    if (!filters || filters.length === 0) {
      return { filters: undefined, boardCountFilter: undefined } as const;
    }

    const remaining: MunicipalityFilter[] = [];
    let boardCountFilter: MunicipalityFilter | undefined;

    for (const filter of filters) {
      if (filter.field === "boardCount" && !boardCountFilter) {
        boardCountFilter = filter;
      } else {
        remaining.push(filter);
      }
    }

    return {
      filters: remaining.length > 0 ? remaining : undefined,
      boardCountFilter,
    } as const;
  }

  private async applyBoardCountFilterToWhere(
    baseWhere: Prisma.MunicipalityWhereInput,
    boardCountFilter?: MunicipalityFilter
  ): Promise<Prisma.MunicipalityWhereInput | null> {
    if (!boardCountFilter) {
      return baseWhere;
    }

    const ids = await this.filterMunicipalityIdsByBoardCount(
      baseWhere,
      boardCountFilter
    );

    if (ids.length === 0) {
      return null;
    }

    return {
      AND: [baseWhere, { id: { in: ids } }],
    } satisfies Prisma.MunicipalityWhereInput;
  }

  private async filterMunicipalityIdsByBoardCount(
    baseWhere: Prisma.MunicipalityWhereInput,
    filter: MunicipalityFilter
  ): Promise<string[]> {
    const municipalities = await this.prisma.municipality.findMany({
      where: baseWhere,
      select: {
        id: true,
        _count: {
          select: {
            boards: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    return municipalities
      .filter(({ _count }) =>
        this.matchesBoardCount(_count.boards ?? 0, filter)
      )
      .map(({ id }) => id);
  }

  private matchesBoardCount(
    actual: number,
    filter: MunicipalityFilter
  ): boolean {
    const operator = filter.operator ?? "equals";

    if (operator === "isEmpty") {
      return actual === 0;
    }

    if (operator === "isNotEmpty") {
      return actual > 0;
    }

    const target = Number(filter.value);

    if (!Number.isFinite(target)) {
      return false;
    }

    const normalizedTarget = Math.max(0, Math.floor(target));

    switch (operator) {
      case "equals":
      case "=":
        return actual === normalizedTarget;
      case "notEqual":
      case "!=":
        return actual !== normalizedTarget;
      case "greaterThan":
      case ">":
        return actual > normalizedTarget;
      case "greaterThanOrEqual":
      case ">=":
        return actual >= normalizedTarget;
      case "lessThan":
      case "<":
        return actual < normalizedTarget;
      case "lessThanOrEqual":
      case "<=":
        return actual <= normalizedTarget;
      default:
        return actual === normalizedTarget;
    }
  }

  private async getMunicipalityIdsSortedByBoardCount(
    where: Prisma.MunicipalityWhereInput,
    direction: "asc" | "desc"
  ): Promise<string[]> {
    const municipalities = await this.prisma.municipality.findMany({
      where,
      select: {
        id: true,
        code: true,
        _count: {
          select: {
            boards: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    const multiplier = direction === "desc" ? -1 : 1;

    return municipalities
      .map((municipality) => ({
        id: municipality.id,
        count: municipality._count?.boards ?? 0,
        code: municipality.code,
      }))
      .sort((a, b) => {
        if (a.count === b.count) {
          return a.code.localeCompare(b.code);
        }

        return a.count < b.count ? -1 * multiplier : multiplier;
      })
      .map((item) => item.id);
  }

  private buildOrderBy(
    options?: FindMunicipalitiesOptions
  ): Prisma.MunicipalityOrderByWithRelationInput[] {
    const defaultOrder: Prisma.MunicipalityOrderByWithRelationInput = {
      code: "asc",
    };

    if (!options?.orderBy) {
      return [defaultOrder];
    }

    const field = options.orderBy.field;
    const direction = options.orderBy.direction;

    if (field === "boardCount") {
      return [defaultOrder];
    }

    const fieldMap: Record<
      Exclude<MunicipalityFilter["field"], "boardCount">,
      keyof Prisma.MunicipalityOrderByWithRelationInput
    > = {
      code: "code",
      name: "name",
      prefecture: "prefecture",
      status: "status",
    };

    const prismaField = fieldMap[field as keyof typeof fieldMap];

    if (!prismaField) {
      return [defaultOrder];
    }

    return [{ [prismaField]: direction }, defaultOrder];
  }

  private isValidFilter(filter: MunicipalityFilter): boolean {
    if (
      !filter.value &&
      filter.operator !== "isEmpty" &&
      filter.operator !== "isNotEmpty"
    ) {
      return false;
    }

    return true;
  }

  private isMunicipalityStatusValue(
    value: string
  ): value is MunicipalityStatus {
    return (Object.values(MunicipalityStatus) as string[]).includes(value);
  }

  private buildStringFilter(
    operator: string | undefined,
    value: string
  ): Prisma.StringFilter {
    const normalized = operator ?? "contains";
    const target = value.trim();

    switch (normalized) {
      case "equals":
      case "=":
        return { equals: target };
      case "startsWith":
        return { startsWith: target, mode: "insensitive" };
      case "endsWith":
        return { endsWith: target, mode: "insensitive" };
      case "isEmpty":
        return { equals: "" };
      case "isNotEmpty":
        return { not: "" };
      case "contains":
      default:
        return { contains: target, mode: "insensitive" };
    }
  }

  private buildNumberFilter(
    operator: string | undefined,
    value: string
  ): Prisma.IntNullableFilter | undefined {
    if (operator === "isEmpty") {
      return { equals: null };
    }

    if (operator === "isNotEmpty") {
      return { not: null };
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return undefined;
    }

    const normalized = operator ?? "equals";

    switch (normalized) {
      case "equals":
      case "=":
        return { equals: numericValue };
      case "greaterThan":
      case ">":
        return { gt: numericValue };
      case "greaterThanOrEqual":
      case ">=":
        return { gte: numericValue };
      case "lessThan":
      case "<":
        return { lt: numericValue };
      case "lessThanOrEqual":
      case "<=":
        return { lte: numericValue };
      default:
        return { equals: numericValue };
    }
  }
}
