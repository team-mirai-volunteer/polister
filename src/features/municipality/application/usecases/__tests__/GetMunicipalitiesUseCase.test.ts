/**
 * GetMunicipalitiesUseCase のユニットテスト
 */

import { beforeEach, describe, expect, it } from "@jest/globals";
import { mock, mockReset } from "jest-mock-extended";
import { Municipality } from "../../../domain/entities/Municipality";
import type { IMunicipalityRepository } from "../../../domain/repositories/IMunicipalityRepository";
import { MunicipalityCode } from "../../../domain/value-objects/MunicipalityCode";
import { GetMunicipalitiesUseCase } from "../GetMunicipalitiesUseCase";

describe("GetMunicipalitiesUseCase", () => {
  const mockRepository = mock<IMunicipalityRepository>();
  const useCase = new GetMunicipalitiesUseCase(mockRepository);

  beforeEach(() => {
    mockReset(mockRepository);
  });

  const createMockMunicipality = (id: string, code: string): Municipality => {
    return new Municipality(
      id,
      "テスト市",
      MunicipalityCode.create(code),
      "テスト県",
      null,
      "MLIT",
      null,
      null,
      null,
      "NOT_STARTED",
      null,
      null,
      null,
      new Date(),
      new Date()
    );
  };

  it("自治体一覧を取得できる", async () => {
    const municipalities = [
      createMockMunicipality("1", "13101"),
      createMockMunicipality("2", "13102"),
    ];

    mockRepository.findAll.mockResolvedValue(municipalities);
    mockRepository.count.mockResolvedValue(2);

    const result = await useCase.execute({ page: 1, limit: 50 });

    expect(result.municipalities).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it("ページ番号が指定されない場合は1ページ目を返す", async () => {
    mockRepository.findAll.mockResolvedValue([]);
    mockRepository.count.mockResolvedValue(0);

    const result = await useCase.execute({});

    expect(result.page).toBe(1);
    expect(mockRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 50 })
    );
  });

  it("ページサイズが指定されない場合は50件を返す", async () => {
    mockRepository.findAll.mockResolvedValue([]);
    mockRepository.count.mockResolvedValue(0);

    const result = await useCase.execute({});

    expect(result.limit).toBe(50);
  });

  it("都道府県でフィルタリングできる", async () => {
    mockRepository.findAll.mockResolvedValue([]);
    mockRepository.count.mockResolvedValue(0);

    await useCase.execute({ prefecture: "東京都" });

    expect(mockRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ prefecture: "東京都" })
    );
    expect(mockRepository.count).toHaveBeenCalledWith(
      expect.objectContaining({ prefecture: "東京都" })
    );
  });

  it("検索キーワードでフィルタリングできる", async () => {
    mockRepository.findAll.mockResolvedValue([]);
    mockRepository.count.mockResolvedValue(0);

    await useCase.execute({ search: "千代田" });

    expect(mockRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ search: "千代田" })
    );
  });

  it("ページネーション計算が正しい", async () => {
    mockRepository.findAll.mockResolvedValue([]);
    mockRepository.count.mockResolvedValue(105);

    const result = await useCase.execute({ page: 3, limit: 50 });

    expect(result.totalPages).toBe(3); // 105件 / 50件 = 3ページ
    expect(mockRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 100, take: 50 }) // 3ページ目 = skip 100
    );
  });
});
