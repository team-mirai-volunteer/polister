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

    if (boardCountFilter.operator === "isEmpty") {
      return {
        AND: [baseWhere, { boards: { none: { deletedAt: null } } }],
      } satisfies Prisma.MunicipalityWhereInput;
    }

    if (boardCountFilter.operator === "isNotEmpty") {
      return {
        AND: [baseWhere, { boards: { some: { deletedAt: null } } }],
      } satisfies Prisma.MunicipalityWhereInput;
    }

    if (!boardCountFilter.value) {
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
    const operator = filter.operator ?? "equals";

    const resolveComparator = (
      comparator: Prisma.NestedIntFilter<"Board">
    ) =>
      this.groupBoardCounts(baseWhere, comparator).then((rows) =>
        rows.map((row) => row.municipalityId)
      );

    if (!filter.value && operator !== "notEqual" && operator !== "!=") {
      return [];
    }

    const target = Number(filter.value);

    const normalizedTarget = Math.floor(target);

    if (
      !Number.isFinite(target) ||
      (!Number.isFinite(normalizedTarget) && operator !== "notEqual" && operator !== "!=")
    ) {
      return [];
    }

    const zeroIdsPromise = this.getMunicipalityIdsWithNoBoards(baseWhere);

    switch (operator) {
      case "equals":
      case "=":
        if (normalizedTarget === 0) {
          return zeroIdsPromise;
        }
        return resolveComparator({ equals: normalizedTarget });
      case "notEqual":
      case "!=": {
        const [allIds, excludedIds] = await Promise.all([
          this.getMunicipalityIds(baseWhere),
          normalizedTarget === 0
            ? zeroIdsPromise
            : resolveComparator({ equals: normalizedTarget }),
        ]);
        const excluded = new Set(excludedIds);
        return allIds.filter((id) => !excluded.has(id));
      }
      case "greaterThan":
      case "gt":
      case ">":
        return resolveComparator({ gt: normalizedTarget });
      case "greaterThanOrEqual":
      case "gte":
      case ">=": {
        const [ids, zeroIds] = await Promise.all([
          resolveComparator({ gte: normalizedTarget }),
          normalizedTarget <= 0 ? zeroIdsPromise : Promise.resolve([]),
        ]);
        return Array.from(new Set([...ids, ...zeroIds]));
      }
      case "lessThan":
      case "lt":
      case "<": {
        const [ids, zeroIds] = await Promise.all([
          resolveComparator({ lt: normalizedTarget }),
          normalizedTarget > 0 ? zeroIdsPromise : Promise.resolve([]),
        ]);
        return Array.from(new Set([...ids, ...zeroIds]));
      }
      case "lessThanOrEqual":
      case "lte":
      case "<=": {
        const [ids, zeroIds] = await Promise.all([
          resolveComparator({ lte: normalizedTarget }),
          normalizedTarget >= 0 ? zeroIdsPromise : Promise.resolve([]),
        ]);
        return Array.from(new Set([...ids, ...zeroIds]));
      }
      default:
        return [];
    }
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
      return [
        {
          boards: {
            _count: direction,
          },
        } as Prisma.MunicipalityOrderByWithRelationInput,
        defaultOrder,
      ];
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
    if (!filter.operator) {
      return false;
    }

    if (filter.operator === "isEmpty" || filter.operator === "isNotEmpty") {
      return true;
    }

    return filter.value !== undefined && filter.value !== "";
  }

  private isMunicipalityStatusValue(
    value: string
  ): value is MunicipalityStatus {
    return (Object.values(MunicipalityStatus) as string[]).includes(value);
  }

  private async getMunicipalityIds(
    where: Prisma.MunicipalityWhereInput
  ): Promise<string[]> {
    const rows = await this.prisma.municipality.findMany({
      where,
      select: { id: true },
    });

    return rows.map((row) => row.id);
  }

  private async getMunicipalityIdsWithNoBoards(
    where: Prisma.MunicipalityWhereInput
  ): Promise<string[]> {
    const rows = await this.prisma.municipality.findMany({
      where: {
        ...where,
        boards: {
          none: {
            deletedAt: null,
          },
        },
      },
      select: { id: true },
    });

    return rows.map((row) => row.id);
  }

  private groupBoardCounts(
    baseWhere: Prisma.MunicipalityWhereInput,
    comparator: Prisma.NestedIntFilter<"Board">
  ) {
    return this.prisma.board.groupBy({
      by: ["municipalityId"],
      where: {
        deletedAt: null,
        municipality: baseWhere,
      },
      _count: {
        municipalityId: true,
      },
      having: {
        municipalityId: {
          _count: comparator,
        },
      },
    });
  }

  private buildStringFilter(
    operator: string | undefined,
    value?: string
  ): Prisma.StringFilter {
    const normalized = operator ?? "contains";
    const target = (value ?? "").trim();

    switch (normalized) {
      case "equals":
      case "=":
        return { equals: target };
      case "notEqual":
      case "!=":
        return { not: target };
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
    value?: string
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
      case "notEqual":
      case "!=":
        return { not: numericValue };
      case "greaterThan":
      case "gt":
      case ">":
        return { gt: numericValue };
      case "greaterThanOrEqual":
      case "gte":
      case ">=":
        return { gte: numericValue };
      case "lessThan":
      case "lt":
      case "<":
        return { lt: numericValue };
      case "lessThanOrEqual":
      case "lte":
      case "<=":
        return { lte: numericValue };
      default:
        return { equals: numericValue };
    }
  }
}
