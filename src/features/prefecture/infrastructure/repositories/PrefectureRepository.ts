/**
 * Prefecture Repository 実装
 *
 * Prismaを用いて都道府県単位の集約情報を提供するリポジトリ
 */

import {
  isBoardStatus,
  isTrustLevel,
} from "@/features/municipality/domain/value-objects/BoardAttributes";
import { MunicipalityMapper } from "@/features/municipality/infrastructure/mappers/MunicipalityMapper";
import type { AppLogger } from "@/shared/lib/di/tokens";
import { TOKENS } from "@/shared/lib/di/tokens";
import type {
  Municipality,
  MunicipalityStatus,
  BoardStatus as PrismaBoardStatus,
  PrismaClient,
  TrustLevel as PrismaTrustLevel,
} from "@prisma/client";
import { inject, injectable } from "tsyringe";

import type { MunicipalityBoardRecord } from "@/features/municipality/domain/repositories/IMunicipalityRepository";
import type { PrefectureProps } from "../../domain/entities/Prefecture";
import { Prefecture } from "../../domain/entities/Prefecture";
import { PrefectureDetail } from "../../domain/entities/PrefectureDetail";
import type {
  FindPrefecturesOptions,
  IPrefectureRepository,
  PrefectureFilter,
  PrefectureFilterOperator,
} from "../../domain/repositories/IPrefectureRepository";
import {
  PREFECTURE_FIELD_OPERATORS,
  PREFECTURE_NUMERIC_FIELDS,
} from "../../domain/repositories/IPrefectureRepository";
import {
  normalizePrefectureCode,
  sanitizePrefectureCode,
} from "../../domain/value-objects/PrefectureCode";

@injectable()
export class PrefectureRepository implements IPrefectureRepository {
  private static readonly collator = new Intl.Collator("ja", {
    numeric: true,
    sensitivity: "base",
  });

  constructor(
    @inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient,
    @inject(TOKENS.Logger) private readonly logger: AppLogger
  ) {}

  async findAll(options: FindPrefecturesOptions = {}): Promise<Prefecture[]> {
    const municipalities = await this.prisma.municipality.findMany({
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        prefecture: true,
        status: true,
        boardCount: true,
      },
    });

    const boardCounts = await this.prisma.board.groupBy({
      by: ["municipalityId"],
      where: {
        deletedAt: null,
      },
      _count: {
        municipalityId: true,
      },
    });

    const boardCountMap = new Map(
      boardCounts.map((row) => [
        row.municipalityId,
        Number(row._count.municipalityId ?? 0),
      ])
    );

    type MunicipalityWithCount = {
      id: string;
      code: string;
      prefecture: string;
      status: MunicipalityStatus;
      boardCount: number | null;
      computedBoardCount: number;
    };

    const municipalitiesWithCount: MunicipalityWithCount[] = municipalities.map(
      (municipality) => ({
        ...municipality,
        computedBoardCount: boardCountMap.get(municipality.id) ?? 0,
      })
    );

    const grouped = new Map<
      string,
      { name: string; items: MunicipalityWithCount[] }
    >();

    for (const municipality of municipalitiesWithCount) {
      let prefectureCode: string;

      try {
        prefectureCode = this.extractPrefectureCode(municipality.code);
      } catch (error) {
        this.logger.warn(
          "[PrefectureRepository] Skip municipality: invalid code",
          {
            municipalityCode: municipality.code,
            error: error instanceof Error ? error.message : String(error),
          }
        );
        continue;
      }
      const existing = grouped.get(prefectureCode);

      if (!existing) {
        grouped.set(prefectureCode, {
          name: municipality.prefecture,
          items: [municipality],
        });
        continue;
      }

      if (existing.name !== municipality.prefecture) {
        this.logger.warn(
          "[PrefectureRepository] Prefecture name mismatch detected",
          {
            code: prefectureCode,
            existingName: existing.name,
            receivedName: municipality.prefecture,
          }
        );
      }

      existing.items.push(municipality);
    }

    let prefectures = Array.from(grouped.entries()).map(
      ([code, { name, items }]) =>
        new Prefecture(this.buildPrefectureProps(code, name, items))
    );

    prefectures = this.applyFilters(prefectures, options.filters);
    prefectures = this.applySort(
      prefectures,
      options.sortField,
      options.sortOrder
    );

    return prefectures;
  }

  async findByCode(code: string): Promise<PrefectureDetail | null> {
    const normalizedCode = normalizePrefectureCode(code);

    const municipalities = await this.prisma.municipality.findMany({
      where: {
        code: {
          startsWith: normalizedCode,
        },
      },
      orderBy: { code: "asc" },
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

    if (municipalities.length === 0) {
      return null;
    }

    const prefectureName = municipalities[0].prefecture;
    const prefectureProps = this.buildPrefectureProps(
      normalizedCode,
      prefectureName,
      municipalities
    );

    const municipalityDomains = municipalities.map((item) =>
      MunicipalityMapper.toDomain(item)
    );

    const boards = await this.findBoardsByPrefectureCode(normalizedCode);

    return new PrefectureDetail({
      ...prefectureProps,
      municipalities: municipalityDomains,
      boards,
    });
  }

  async findBoardsByPrefectureCode(
    code: string
  ): Promise<MunicipalityBoardRecord[]> {
    const normalizedCode = normalizePrefectureCode(code);

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
        b.id,
        b.board_number,
        b.name,
        b.address,
        ST_X(b.location::geometry) AS longitude,
        ST_Y(b.location::geometry) AS latitude,
        b.status,
        b.trust_level
      FROM boards b
      INNER JOIN municipalities m
        ON b.municipality_id = m.id
      WHERE m.code LIKE ${normalizedCode + "%"}
        AND b.deleted_at IS NULL
        AND b.location IS NOT NULL
      ORDER BY m.code ASC, b.board_number ASC NULLS LAST, b.created_at ASC
    `;

    return this.transformBoardRows(rows);
  }

  private buildPrefectureProps(
    code: string,
    name: string,
    municipalities: Array<
      Pick<Municipality, "status" | "boardCount"> & {
        computedBoardCount?: number;
        _count?: {
          boards?: number;
        };
      }
    >
  ): PrefectureProps {
    const statusCounts: Partial<Record<MunicipalityStatus, number>> = {};
    let totalBoardCount = 0;

    for (const municipality of municipalities) {
      const status = municipality.status as MunicipalityStatus;
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;

      const boardCount =
        municipality.boardCount ??
        municipality._count?.boards ??
        municipality.computedBoardCount ??
        0;

      totalBoardCount += boardCount;
    }

    return {
      code,
      name,
      municipalityCount: municipalities.length,
      totalBoardCount,
      statusCounts,
    };
  }

  private extractPrefectureCode(municipalityCode: string): string {
    if (municipalityCode.length >= 2) {
      const candidate = municipalityCode.slice(0, 2);
      return (
        sanitizePrefectureCode(candidate) ?? normalizePrefectureCode(candidate)
      );
    }

    return normalizePrefectureCode(municipalityCode);
  }

  private transformBoardRows(
    rows: Array<{
      id: string;
      board_number: number | null;
      name: string | null;
      address: string;
      longitude: number | null;
      latitude: number | null;
      status: PrismaBoardStatus;
      trust_level: PrismaTrustLevel;
    }>
  ): MunicipalityBoardRecord[] {
    return rows
      .map((row) => {
        if (!isBoardStatus(row.status)) {
          this.logger.warn(
            "[PrefectureRepository] Skip board: invalid status",
            {
              id: row.id,
              status: row.status,
            }
          );
          return null;
        }

        if (!isTrustLevel(row.trust_level)) {
          this.logger.warn(
            "[PrefectureRepository] Skip board: invalid trust level",
            {
              id: row.id,
              trustLevel: row.trust_level,
            }
          );
          return null;
        }

        return {
          id: row.id,
          boardNumber: row.board_number,
          name: row.name,
          address: row.address,
          longitude: row.longitude,
          latitude: row.latitude,
          status: row.status,
          trustLevel: row.trust_level,
        } satisfies MunicipalityBoardRecord;
      })
      .filter((item): item is MunicipalityBoardRecord => item !== null);
  }

  private applyFilters(
    prefectures: Prefecture[],
    filters: PrefectureFilter[] | undefined
  ): Prefecture[] {
    if (!filters || filters.length === 0) {
      return prefectures;
    }

    const filtered = filters.reduce((items, filter) => {
      const normalizedOperator: PrefectureFilterOperator =
        filter.operator ?? this.defaultOperator(filter.field);

      return items.filter((prefecture) =>
        this.matchesFilter(prefecture, {
          ...filter,
          operator: normalizedOperator,
        })
      );
    }, prefectures);

    return filtered;
  }

  private applySort(
    prefectures: Prefecture[],
    sortField: FindPrefecturesOptions["sortField"],
    sortOrder: FindPrefecturesOptions["sortOrder"]
  ): Prefecture[] {
    const sorted = [...prefectures];

    if (!sortField) {
      return this.sortByCode(sorted);
    }

    const order = sortOrder === "desc" ? -1 : 1;

    sorted.sort((a, b) => {
      const left = this.getFieldValue(a, sortField);
      const right = this.getFieldValue(b, sortField);

      if (left === right) {
        return 0;
      }

      if (left === null || left === undefined) {
        return -1 * order;
      }

      if (right === null || right === undefined) {
        return order;
      }

      if (typeof left === "number" && typeof right === "number") {
        return (left - right) * order;
      }

      return (
        PrefectureRepository.collator.compare(String(left), String(right)) *
        order
      );
    });

    return sorted;
  }

  private defaultOperator(
    field: PrefectureFilter["field"]
  ): PrefectureFilterOperator {
    return PREFECTURE_FIELD_OPERATORS[field][0];
  }

  private matchesFilter(
    prefecture: Prefecture,
    filter: PrefectureFilter
  ): boolean {
    const value = this.getFieldValue(prefecture, filter.field);
    const operator = filter.operator ?? this.defaultOperator(filter.field);

    if (PREFECTURE_NUMERIC_FIELDS.includes(filter.field)) {
      const normalizedValue = this.normalizeNumericFilter(
        filter.field,
        filter.value
      );
      return this.compareNumber(
        (value as number | null) ?? null,
        operator,
        normalizedValue,
        filter.field
      );
    }

    return this.compareString(String(value ?? ""), operator, filter.value);
  }

  private normalizeNumericFilter(
    field: PrefectureFilter["field"],
    rawValue?: string
  ): string {
    if (field === "completionRate") {
      const parsed = Number(rawValue);

      if (Number.isFinite(parsed) && Math.abs(parsed) > 1) {
        return String(parsed / 100);
      }
    }

    return rawValue ?? "";
  }

  private compareNumber(
    value: number | null,
    operator: string,
    rawValue: string,
    field?: PrefectureFilter["field"]
  ): boolean {
    if (operator === "isEmpty") {
      return value === null;
    }

    if (operator === "isNotEmpty") {
      return value !== null;
    }

    const target = Number(rawValue);

    if (!Number.isFinite(target)) {
      return false;
    }

    if (value === null) {
      return false;
    }

    switch (operator) {
      case "equals":
      case "=":
        return this.equalsNumber(value, target, field);
      case "notEqual":
      case "!=":
        return !this.equalsNumber(value, target, field);
      case "greaterThan":
      case "gt":
      case ">":
        return value > target;
      case "greaterThanOrEqual":
      case "gte":
      case ">=":
        return value >= target;
      case "lessThan":
      case "lt":
      case "<":
        return value < target;
      case "lessThanOrEqual":
      case "lte":
      case "<=":
        return value <= target;
      default:
        return this.equalsNumber(value, target, field);
    }
  }

  private equalsNumber(
    value: number,
    target: number,
    field?: PrefectureFilter["field"]
  ): boolean {
    if (field === "completionRate") {
      const displayedValue = Math.round(value * 1000) / 10;
      const displayedTarget = Math.round(target * 1000) / 10;
      return displayedValue === displayedTarget;
    }

    return value === target;
  }

  private compareString(
    value: string,
    operator: string,
    rawValue?: string
  ): boolean {
    if (operator === "isEmpty") {
      return value.length === 0;
    }

    if (operator === "isNotEmpty") {
      return value.length > 0;
    }

    const target = (rawValue ?? "").trim();

    if (!target) {
      return false;
    }

    const source = this.normalizeText(value);
    const compared = this.normalizeText(target);

    switch (operator) {
      case "equals":
      case "=":
        return source === compared;
      case "notEqual":
      case "!=":
        return source !== compared;
      case "startsWith":
        return source.startsWith(compared);
      case "endsWith":
        return source.endsWith(compared);
      case "contains":
      default:
        return source.includes(compared);
    }
  }

  private getFieldValue(
    prefecture: Prefecture,
    field: PrefectureFilter["field"]
  ): string | number | null {
    switch (field) {
      case "code":
        return prefecture.code;
      case "name":
        return prefecture.name;
      case "municipalityCount":
        return prefecture.municipalityCount;
      case "completedMunicipalityCount":
        return prefecture.completedMunicipalityCount;
      case "completionRate":
        return prefecture.completionRate;
      case "totalBoardCount":
        return prefecture.totalBoardCount;
      default:
        return null;
    }
  }

  private sortByCode(prefectures: Prefecture[]): Prefecture[] {
    return [...prefectures].sort((a, b) =>
      PrefectureRepository.collator.compare(a.code, b.code)
    );
  }

  private normalizeText(value: string): string {
    return value.normalize("NFKC").toLocaleLowerCase("ja");
  }
}
