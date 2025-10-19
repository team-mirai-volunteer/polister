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
    const boards =
      await this.municipalityRepository.findBoardsByMunicipalityId(
        municipalityId
      );

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
