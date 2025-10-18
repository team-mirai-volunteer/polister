/**
 * ExportMunicipalityGeoJSONUseCase のユニットテスト
 */

import { beforeEach, describe, expect, it } from "@jest/globals";
import { mock, mockReset } from "jest-mock-extended";
import type { IMunicipalityRepository } from "../../../domain/repositories/IMunicipalityRepository";
import { ExportMunicipalityGeoJSONUseCase } from "../ExportMunicipalityGeoJSONUseCase";

describe("ExportMunicipalityGeoJSONUseCase", () => {
  const mockRepository = mock<IMunicipalityRepository>();
  const useCase = new ExportMunicipalityGeoJSONUseCase(mockRepository);

  beforeEach(() => {
    mockReset(mockRepository);
  });

  it("自治体のGeoJSONを取得できる", async () => {
    const mockGeoJSON = {
      type: "Feature" as const,
      properties: {
        name: "千代田区",
        code: "13101",
        prefecture: "東京都",
      },
      geometry: {
        type: "MultiPolygon" as const,
        coordinates: [
          [
            [
              [139.7453, 35.6762],
              [139.7453, 35.6762],
              [139.7453, 35.6762],
            ],
          ],
        ],
      },
    };

    mockRepository.exportAsGeoJSON.mockResolvedValue(mockGeoJSON);

    const result = await useCase.execute("test-id");

    expect(result).not.toBeNull();
    expect(result?.type).toBe("Feature");
    expect(result?.properties.name).toBe("千代田区");
    expect(mockRepository.exportAsGeoJSON).toHaveBeenCalledWith("test-id");
  });

  it("存在しないIDの場合nullを返す", async () => {
    mockRepository.exportAsGeoJSON.mockResolvedValue(null);

    const result = await useCase.execute("non-existent-id");

    expect(result).toBeNull();
  });
});
