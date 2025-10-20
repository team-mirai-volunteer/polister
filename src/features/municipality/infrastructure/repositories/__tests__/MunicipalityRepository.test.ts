/**
 * MunicipalityRepository のユニットテスト
 */

import { beforeEach, describe, expect, it } from "@jest/globals";
import type { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset } from "jest-mock-extended";
import { MunicipalityRepository } from "../MunicipalityRepository";

describe("MunicipalityRepository", () => {
  const mockPrisma = mockDeep<PrismaClient>();
  const repository = new MunicipalityRepository(mockPrisma);

  beforeEach(() => {
    mockReset(mockPrisma);
  });

  const createMockPrismaData = () =>
    ({
      id: "test-id",
      name: "千代田区",
      code: "13101",
      prefecture: "東京都",
      source: "MLIT",
      url: null,
      boardCount: null,
      dataVersion: null,
      status: "NOT_STARTED",
      contactStatus: null,
      notes: null,
      folderId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as const;

  describe("findById", () => {
    it("IDで自治体を検索できる", async () => {
      const mockData = createMockPrismaData();
      mockPrisma.municipality.findUnique.mockResolvedValue(mockData);

      const result = await repository.findById("test-id");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("test-id");
      expect(result?.name).toBe("千代田区");
    });

    it("存在しないIDの場合nullを返す", async () => {
      mockPrisma.municipality.findUnique.mockResolvedValue(null);

      const result = await repository.findById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("findByCode", () => {
    it("コードで自治体を検索できる", async () => {
      const mockData = createMockPrismaData();
      mockPrisma.municipality.findUnique.mockResolvedValue(mockData);

      const result = await repository.findByCode("13101");

      expect(result).not.toBeNull();
      expect(result?.code.toString()).toBe("13101");
    });
  });

  describe("findAll", () => {
    it("自治体一覧を取得できる", async () => {
      const mockData = [createMockPrismaData()];
      mockPrisma.municipality.findMany.mockResolvedValue(mockData);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
    });

    it("ページネーションオプションが正しく適用される", async () => {
      mockPrisma.municipality.findMany.mockResolvedValue([]);

      await repository.findAll({ skip: 50, take: 25 });

      expect(mockPrisma.municipality.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 50,
          take: 25,
        })
      );
    });

    it("都道府県フィルタが正しく適用される", async () => {
      mockPrisma.municipality.findMany.mockResolvedValue([]);

      await repository.findAll({ prefecture: "東京都" });

      expect(mockPrisma.municipality.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            prefecture: "東京都",
          }),
        })
      );
    });
  });

  describe("count", () => {
    it("自治体の総数を取得できる", async () => {
      mockPrisma.municipality.count.mockResolvedValue(1905);

      const result = await repository.count();

      expect(result).toBe(1905);
    });

    it("フィルタ条件が正しく適用される", async () => {
      mockPrisma.municipality.count.mockResolvedValue(23);

      await repository.count({ prefecture: "東京都" });

      expect(mockPrisma.municipality.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            prefecture: "東京都",
          }),
        })
      );
    });
  });

  describe("exportAsGeoJSON", () => {
    it("GeoJSONを取得できる", async () => {
      const mockResult = [
        {
          geojson: '{"type":"Point","coordinates":[139.7453,35.6762]}',
          name: "千代田区",
          code: "13101",
          prefecture: "東京都",
        },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(mockResult);

      const result = await repository.exportAsGeoJSON("test-id");

      expect(result).not.toBeNull();
      expect(result?.type).toBe("Feature");
      expect(result?.properties.name).toBe("千代田区");
    });

    it("ポリゴンがない場合nullを返す", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await repository.exportAsGeoJSON("test-id");

      expect(result).toBeNull();
    });
  });
});
