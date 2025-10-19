import { beforeEach, describe, expect, it } from "@jest/globals";
import { mock, mockReset } from "jest-mock-extended";

import type {
  IMunicipalityRepository,
  MunicipalityBoardRecord,
} from "../../../domain/repositories/IMunicipalityRepository";
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
      overrides.boardNumber !== undefined ? overrides.boardNumber : 1,
    name: overrides.name ?? "掲示板",
    address: overrides.address ?? "住所",
    longitude: overrides.longitude !== undefined ? overrides.longitude : 139.0,
    latitude: overrides.latitude !== undefined ? overrides.latitude : 35.0,
    status: overrides.status ?? "PENDING",
    trustLevel: overrides.trustLevel ?? "LEVEL_3",
  });

  it("掲示板一覧を取得できる", async () => {
    const records = [
      createBoardRecord({ id: "board-1", boardNumber: 10 }),
      createBoardRecord({
        id: "board-2",
        boardNumber: 20,
        longitude: null,
        latitude: null,
      }),
    ];
    repository.findBoardsByMunicipalityId.mockResolvedValue(records);

    const result = await useCase.execute("municipality-1");

    expect(repository.findBoardsByMunicipalityId).toHaveBeenCalledWith(
      "municipality-1"
    );
    expect(result).toEqual([
      {
        id: "board-1",
        boardNumber: 10,
        name: "掲示板",
        address: "住所",
        longitude: 139,
        latitude: 35,
        status: "PENDING",
        trustLevel: "LEVEL_3",
      },
      {
        id: "board-2",
        boardNumber: 20,
        name: "掲示板",
        address: "住所",
        longitude: null,
        latitude: null,
        status: "PENDING",
        trustLevel: "LEVEL_3",
      },
    ]);
  });
});
