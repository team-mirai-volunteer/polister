/**
 * GetBoardLocationsUseCase
 *
 * 掲示板位置情報を取得するユースケース
 */

import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";

import { BOARD_LOCATION_FETCH_LIMIT_MAX } from "@/features/board/domain/constants";
import { sanitizeLimit } from "@/shared/lib/validation/sanitizeLimit";
import type { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import type { BoardLocationDTO } from "../dto/BoardLocationDTO";

export interface GetBoardLocationsInput {
  limit?: number;
}

@injectable()
export class GetBoardLocationsUseCase {
  constructor(
    @inject(TOKENS.BoardRepository)
    private readonly repository: IBoardRepository
  ) {}

  async execute(
    input: GetBoardLocationsInput = {}
  ): Promise<BoardLocationDTO[]> {
    const limit = sanitizeLimit(input?.limit, {
      max: BOARD_LOCATION_FETCH_LIMIT_MAX,
    });

    const locations = await this.repository.findAllWithLocation({ limit });

    return locations.map((location) => ({
      id: location.id,
      boardNumber: location.boardNumber,
      name: location.name,
      address: location.address,
      longitude: location.longitude,
      latitude: location.latitude,
      status: location.status,
      trustLevel: location.trustLevel,
    }));
  }
}
