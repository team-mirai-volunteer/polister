/**
 * GetBoardLocationsUseCase
 *
 * 掲示板位置情報を取得するユースケース
 */

import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";

import { BOARD_LOCATION_FETCH_LIMIT_MAX } from "@/features/board/domain/constants";
import type {
  BoardStatus,
  TrustLevel,
} from "@/shared/domain/board/BoardAttributes";
import { sanitizeLimit } from "@/shared/lib/validation/sanitizeLimit";
import type { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { BoardLocationMapper } from "../../infrastructure/mappers/BoardLocationMapper";

export interface BoardLocationDTO {
  id: string;
  boardNumber: number | null;
  name: string | null;
  address: string;
  longitude: number | null;
  latitude: number | null;
  status: BoardStatus;
  trustLevel: TrustLevel;
}

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

    return locations.map((location) => BoardLocationMapper.toDTO(location));
  }
}
