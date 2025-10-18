/**
 * MunicipalityMapper のユニットテスト
 */

import { describe, expect, it } from "@jest/globals";
import type { Municipality as PrismaMunicipality } from "@prisma/client";
import { MunicipalityMapper } from "../MunicipalityMapper";

describe("MunicipalityMapper", () => {
  const createPrismaData = (): PrismaMunicipality =>
    ({
      id: "test-id",
      name: "千代田区",
      code: "13101",
      prefecture: "東京都",
      source: "MLIT",
      url: "https://example.com",
      boardCount: 100,
      dataVersion: "2025参院選版",
      status: "COMPLETED",
      contactStatus: "RECEIVED",
      notes: "テスト備考",
      folderId: "folder-id",
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-02"),
    }) as const;

  describe("toDomain", () => {
    it("PrismaモデルからDomainモデルに変換できる", () => {
      const prismaData = createPrismaData();
      const domain = MunicipalityMapper.toDomain(prismaData);

      expect(domain.id).toBe("test-id");
      expect(domain.name).toBe("千代田区");
      expect(domain.code.toString()).toBe("13101");
      expect(domain.prefecture).toBe("東京都");
      expect(domain.source).toBe("MLIT");
      expect(domain.url).toBe("https://example.com");
      expect(domain.boardCount).toBe(100);
      expect(domain.dataVersion).toBe("2025参院選版");
      expect(domain.status).toBe("COMPLETED");
      expect(domain.contactStatus).toBe("RECEIVED");
      expect(domain.notes).toBe("テスト備考");
      expect(domain.folderId).toBe("folder-id");
    });

    it("nullableなフィールドがnullでもエラーにならない", () => {
      const prismaData: PrismaMunicipality = {
        ...createPrismaData(),
        url: null,
        boardCount: null,
        dataVersion: null,
        contactStatus: null,
        notes: null,
        folderId: null,
      };

      const domain = MunicipalityMapper.toDomain(prismaData);

      expect(domain.url).toBeNull();
      expect(domain.boardCount).toBeNull();
      expect(domain.dataVersion).toBeNull();
      expect(domain.contactStatus).toBeNull();
      expect(domain.notes).toBeNull();
      expect(domain.folderId).toBeNull();
    });
  });

  describe("toDTO", () => {
    it("DomainモデルからDTOに変換できる", () => {
      const prismaData = createPrismaData();
      const domain = MunicipalityMapper.toDomain(prismaData);
      const dto = MunicipalityMapper.toDTO(domain);

      expect(dto.id).toBe("test-id");
      expect(dto.name).toBe("千代田区");
      expect(dto.code).toBe("13101");
      expect(dto.prefecture).toBe("東京都");
      expect(dto.fullName).toBe("東京都 千代田区");
      expect(dto.isDataCollected).toBe(true);
      expect(dto.canContact).toBe(false);
      expect(dto.isInProgress).toBe(false);
    });

    it("日時がISO文字列に変換される", () => {
      const prismaData = createPrismaData();
      const domain = MunicipalityMapper.toDomain(prismaData);
      const dto = MunicipalityMapper.toDTO(domain);

      expect(typeof dto.createdAt).toBe("string");
      expect(typeof dto.updatedAt).toBe("string");
      expect(dto.createdAt).toContain("2025-01-01");
      expect(dto.updatedAt).toContain("2025-01-02");
    });
  });

  describe("toPrisma", () => {
    it("DomainモデルからPrisma更新データに変換できる", () => {
      const prismaData = createPrismaData();
      const domain = MunicipalityMapper.toDomain(prismaData);
      const prismaUpdate = MunicipalityMapper.toPrisma(domain);

      expect(prismaUpdate.name).toBe("千代田区");
      expect(prismaUpdate.code).toBe("13101");
      expect(prismaUpdate.prefecture).toBe("東京都");
      expect(prismaUpdate.source).toBe("MLIT");
      expect(prismaUpdate.url).toBe("https://example.com");
      expect(prismaUpdate.boardCount).toBe(100);
    });

    it("idとcreatedAt、updatedAtは含まれない", () => {
      const prismaData = createPrismaData();
      const domain = MunicipalityMapper.toDomain(prismaData);
      const prismaUpdate = MunicipalityMapper.toPrisma(domain);

      expect(prismaUpdate).not.toHaveProperty("id");
      expect(prismaUpdate).not.toHaveProperty("createdAt");
      expect(prismaUpdate).not.toHaveProperty("updatedAt");
      expect(prismaUpdate).not.toHaveProperty("polygon");
    });
  });
});
