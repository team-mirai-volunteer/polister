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
import type { IPrefectureRepository } from "../../domain/repositories/IPrefectureRepository";

@injectable()
export class PrefectureRepository implements IPrefectureRepository {
  constructor(
    @inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient
  ) {}

  async findAll(): Promise<Prefecture[]> {
    const municipalities = await this.prisma.municipality.findMany({
      orderBy: { code: "asc" },
    });

    const grouped = new Map<string, { name: string; items: Municipality[] }>();

    for (const municipality of municipalities) {
      const prefectureCode = this.extractPrefectureCode(municipality.code);
      const existing = grouped.get(prefectureCode);

      if (!existing) {
        grouped.set(prefectureCode, {
          name: municipality.prefecture,
          items: [municipality],
        });
        continue;
      }

      if (existing.name !== municipality.prefecture) {
        console.warn(
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

    return Array.from(grouped.entries())
      .map(
        ([code, { name, items }]) =>
          new Prefecture(this.buildPrefectureProps(code, name, items))
      )
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  async findByCode(code: string): Promise<PrefectureDetail | null> {
    const normalizedCode = this.normalizePrefectureCode(code);

    const municipalities = await this.prisma.municipality.findMany({
      where: {
        code: {
          startsWith: normalizedCode,
        },
      },
      orderBy: { code: "asc" },
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
    const normalizedCode = this.normalizePrefectureCode(code);

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
      ORDER BY m.code ASC, b.board_number ASC NULLS LAST, b.created_at ASC
    `;

    return this.transformBoardRows(rows);
  }

  private buildPrefectureProps(
    code: string,
    name: string,
    municipalities: Municipality[]
  ): PrefectureProps {
    const statusCounts: Partial<Record<MunicipalityStatus, number>> = {};
    let totalBoardCount = 0;
    let hasBoardCount = false;

    for (const municipality of municipalities) {
      const status = municipality.status as MunicipalityStatus;
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;

      if (municipality.boardCount !== null) {
        totalBoardCount += municipality.boardCount;
        hasBoardCount = true;
      }
    }

    return {
      code,
      name,
      municipalityCount: municipalities.length,
      totalBoardCount: hasBoardCount ? totalBoardCount : null,
      statusCounts,
    };
  }

  private extractPrefectureCode(municipalityCode: string): string {
    if (municipalityCode.length >= 2) {
      return municipalityCode.slice(0, 2);
    }

    return this.normalizePrefectureCode(municipalityCode);
  }

  private normalizePrefectureCode(code: string): string {
    const normalized = code.trim();

    if (normalized.length >= 2) {
      return normalized.slice(0, 2);
    }

    return normalized.padStart(2, "0");
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
          console.warn("[PrefectureRepository] Skip board: invalid status", {
            id: row.id,
            status: row.status,
          });
          return null;
        }

        if (!isTrustLevel(row.trust_level)) {
          console.warn(
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
          boardNumber:
            row.board_number !== null ? Number(row.board_number) : null,
          name: row.name,
          address: row.address,
          longitude: row.longitude !== null ? Number(row.longitude) : null,
          latitude: row.latitude !== null ? Number(row.latitude) : null,
          status: row.status,
          trustLevel: row.trust_level,
        } satisfies MunicipalityBoardRecord;
      })
      .filter((item): item is MunicipalityBoardRecord => item !== null);
  }
}
