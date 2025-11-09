/**
 * Board Repository インターフェース
 */

import type { Board } from "../aggregates/Board";
import type { BoardLocation } from "../entities/BoardLocation";

export interface FindBoardLocationsOptions {
  /**
   * 最大取得件数（指定しない場合は全件）
   */
  limit?: number;
}

export interface IBoardRepository {
  /**
   * 地図表示用の掲示板位置情報を全件取得
   */
  findAllWithLocation(
    options?: FindBoardLocationsOptions
  ): Promise<BoardLocation[]>;

  /**
   * IDで掲示板を取得
   */
  findById(id: string): Promise<Board | null>;

  /**
   * 掲示板を更新
   */
  update(board: Board): Promise<void>;

  /**
   * 自治体内で掲示板番号の重複をチェック
   */
  existsByBoardNumberInMunicipality(
    municipalityId: string,
    boardNumber: string,
    excludeBoardId?: string
  ): Promise<boolean>;
}
