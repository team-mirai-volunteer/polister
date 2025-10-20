/**
 * Municipality Mapper
 *
 * PrismaモデルとDomainモデルの相互変換を行うマッパー
 */

import type { Municipality as PrismaMunicipality } from "@prisma/client";
import { Municipality } from "../../domain/entities/Municipality";
import { MunicipalityCode } from "../../domain/value-objects/MunicipalityCode";

export class MunicipalityMapper {
  /**
   * PrismaモデルからDomainモデルに変換
   */
  static toDomain(
    prisma: PrismaMunicipality & {
      _count?: {
        boards?: number | null;
      };
    }
  ): Municipality {
    const boardCount = prisma.boardCount ?? prisma._count?.boards ?? null;

    return new Municipality(
      prisma.id,
      prisma.name,
      MunicipalityCode.create(prisma.code),
      prisma.prefecture,
      null, // polygonはUnsupported型なのでnullを設定
      prisma.source,
      prisma.url,
      boardCount,
      prisma.dataVersion,
      prisma.status,
      prisma.contactStatus,
      prisma.notes,
      prisma.folderId,
      prisma.createdAt,
      prisma.updatedAt
    );
  }

  /**
   * DomainモデルからPrisma更新データに変換
   */
  static toPrisma(
    municipality: Municipality
  ): Omit<PrismaMunicipality, "id" | "createdAt" | "updatedAt" | "polygon"> {
    return {
      name: municipality.name,
      code: municipality.code.toString(),
      prefecture: municipality.prefecture,
      source: municipality.source,
      url: municipality.url,
      boardCount: municipality.boardCount,
      dataVersion: municipality.dataVersion,
      status: municipality.status,
      contactStatus: municipality.contactStatus,
      notes: municipality.notes,
      folderId: municipality.folderId,
    };
  }

  /**
   * DomainモデルをAPI用DTOに変換
   */
  static toDTO(municipality: Municipality) {
    return {
      id: municipality.id,
      name: municipality.name,
      code: municipality.code.toString(),
      prefecture: municipality.prefecture,
      source: municipality.source,
      url: municipality.url,
      boardCount: municipality.boardCount,
      dataVersion: municipality.dataVersion,
      status: municipality.status,
      contactStatus: municipality.contactStatus,
      notes: municipality.notes,
      folderId: municipality.folderId,
      createdAt: municipality.createdAt.toISOString(),
      updatedAt: municipality.updatedAt.toISOString(),
      // 算出プロパティ
      isDataCollected: municipality.isDataCollected(),
      canContact: municipality.canContact(),
      isInProgress: municipality.isInProgress(),
      fullName: municipality.getFullName(),
    };
  }
}
