/**
 * Board Repository インターフェース
 */

import type { BoardLocation } from "../entities/BoardLocation";

export interface FindBoardLocationsOptions {
  /**
   * 最大取得件数（指定しない場合は全件）
   */
  limit?: number;
}

export interface IBoardRepository {
  findAllWithLocation(
    options?: FindBoardLocationsOptions
  ): Promise<BoardLocation[]>;
}
