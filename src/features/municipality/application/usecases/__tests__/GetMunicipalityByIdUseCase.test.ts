/**
 * GetMunicipalityByIdUseCase のユニットテスト
 */

import { beforeEach, describe, expect, it } from "@jest/globals";
import { mock, mockReset } from "jest-mock-extended";
import { Municipality } from "../../../domain/entities/Municipality";
import type { IMunicipalityRepository } from "../../../domain/repositories/IMunicipalityRepository";
import { MunicipalityCode } from "../../../domain/value-objects/MunicipalityCode";
import { GetMunicipalityByIdUseCase } from "../GetMunicipalityByIdUseCase";

describe("GetMunicipalityByIdUseCase", () => {
  const mockRepository = mock<IMunicipalityRepository>();
  const useCase = new GetMunicipalityByIdUseCase(mockRepository);

  beforeEach(() => {
    mockReset(mockRepository);
  });

  const createMockMunicipality = (): Municipality => {
    return new Municipality(
      "test-id",
      "千代田区",
      MunicipalityCode.create("13101"),
      "東京都",
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

  it("IDで自治体を取得できる", async () => {
    const municipality = createMockMunicipality();
    mockRepository.findById.mockResolvedValue(municipality);

    const result = await useCase.execute("test-id");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("test-id");
    expect(mockRepository.findById).toHaveBeenCalledWith("test-id");
  });

  it("存在しないIDの場合nullを返す", async () => {
    mockRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute("non-existent-id");

    expect(result).toBeNull();
  });
});
