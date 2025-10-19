/**
 * GetMunicipalityBoardsUseCase
 *
 * 自治体に紐づく掲示板一覧を取得するユースケース
 */

import { inject, injectable } from "tsyringe";

import { TOKENS } from "@/shared/lib/di/tokens";
import type { IMunicipalityRepository } from "../../domain/repositories/IMunicipalityRepository";
import type { MunicipalityBoardDTO } from "../dto/MunicipalityBoardDTO";

@injectable()
export class GetMunicipalityBoardsUseCase {
  constructor(
    @inject(TOKENS.MunicipalityRepository)
    private readonly municipalityRepository: IMunicipalityRepository
  ) {}

  async execute(municipalityId: string): Promise<MunicipalityBoardDTO[]> {
    const trimmedId = municipalityId.trim();

    if (trimmedId.length === 0) {
      throw new Error("municipalityId is required");
    }

    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

    if (!uuidRegex.test(trimmedId)) {
      throw new Error("municipalityId must be a valid UUID");
    }

    const boards =
      await this.municipalityRepository.findBoardsByMunicipalityId(trimmedId);

    return boards.map((board) => ({
      id: board.id,
      boardNumber: board.boardNumber,
      name: board.name,
      address: board.address,
      longitude: board.longitude,
      latitude: board.latitude,
      status: board.status,
      trustLevel: board.trustLevel,
    }));
  }
}
