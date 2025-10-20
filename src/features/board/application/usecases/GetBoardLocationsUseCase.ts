/**
 * GetBoardLocationsUseCase
 *
 * 掲示板位置情報を取得するユースケース
 */

import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";

import type {
  BoardStatus,
  TrustLevel,
} from "@/features/municipality/domain/value-objects/BoardAttributes";
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
    const rawLimit = input?.limit;
    const limit =
      typeof rawLimit === "number" && Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.floor(rawLimit)
        : undefined;

    const locations = await this.repository.findAllWithLocation({ limit });

    return locations.map((location) => BoardLocationMapper.toDTO(location));
  }
}
