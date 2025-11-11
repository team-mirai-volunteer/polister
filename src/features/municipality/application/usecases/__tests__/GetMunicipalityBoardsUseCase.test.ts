import { beforeEach, describe, expect, it } from "@jest/globals";
import { mock, mockReset } from "jest-mock-extended";

import type {
  IMunicipalityRepository,
  MunicipalityBoardRecord,
} from "../../../domain/repositories/IMunicipalityRepository";
import type {
  BoardStatus,
  TrustLevel,
} from "../../../domain/value-objects/BoardAttributes";
import { GetMunicipalityBoardsUseCase } from "../GetMunicipalityBoardsUseCase";

describe("GetMunicipalityBoardsUseCase", () => {
  const repository = mock<IMunicipalityRepository>();
  const useCase = new GetMunicipalityBoardsUseCase(repository);

  beforeEach(() => {
    mockReset(repository);
  });

  const createBoardRecord = (
    overrides: Partial<MunicipalityBoardRecord> = {}
  ): MunicipalityBoardRecord => ({
    id: overrides.id ?? "board-id",
    boardNumber:
      overrides.boardNumber !== undefined ? overrides.boardNumber : "1",
    name: overrides.name ?? "掲示場",
    address: overrides.address ?? "住所",
    longitude: overrides.longitude !== undefined ? overrides.longitude : 139.0,
    latitude: overrides.latitude !== undefined ? overrides.latitude : 35.0,
    status: overrides.status ?? ("PENDING" as BoardStatus),
    trustLevel: overrides.trustLevel ?? ("LEVEL_3" as TrustLevel),
  });

  it("掲示場一覧を取得できる", async () => {
    const records = [
      createBoardRecord({ id: "board-1", boardNumber: "10" }),
      createBoardRecord({
        id: "board-2",
        boardNumber: "20",
        longitude: null,
        latitude: null,
      }),
    ];
    repository.findBoardsByMunicipalityId.mockResolvedValue(records);

    const municipalityId = "123e4567-e89b-12d3-a456-426614174000";

    const result = await useCase.execute(municipalityId);

    expect(repository.findBoardsByMunicipalityId).toHaveBeenCalledWith(
      municipalityId
    );
    expect(result).toEqual([
      {
        id: "board-1",
        boardNumber: "10",
        name: "掲示場",
        address: "住所",
        longitude: 139,
        latitude: 35,
        status: "PENDING",
        trustLevel: "LEVEL_3",
      },
      {
        id: "board-2",
        boardNumber: "20",
        name: "掲示場",
        address: "住所",
        longitude: null,
        latitude: null,
        status: "PENDING",
        trustLevel: "LEVEL_3",
      },
    ]);
  });

  it("不正なUUIDの場合はエラーを投げる", async () => {
    await expect(useCase.execute("invalid-id")).rejects.toThrow(
      "municipalityId must be a valid UUID"
    );
    expect(repository.findBoardsByMunicipalityId).not.toHaveBeenCalled();
  });

  it("掲示場が存在しない場合は空配列を返す", async () => {
    repository.findBoardsByMunicipalityId.mockResolvedValue([]);

    const municipalityId = "123e4567-e89b-12d3-a456-426614174001";

    const result = await useCase.execute(municipalityId);

    expect(repository.findBoardsByMunicipalityId).toHaveBeenCalledWith(
      municipalityId
    );
    expect(result).toEqual([]);
  });

  it("リポジトリエラーが発生した場合はエラーを伝播する", async () => {
    const error = new Error("Database connection failed");
    repository.findBoardsByMunicipalityId.mockRejectedValue(error);

    const municipalityId = "123e4567-e89b-12d3-a456-426614174002";

    await expect(useCase.execute(municipalityId)).rejects.toThrow(error);
  });
});
