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

export interface FindByLocationOptions {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  limit?: number;
}

export interface FindByMunicipalityOptions {
  prefecture: string;
  city: string;
  limit?: number;
}

export interface IBoardRepository {
  /**
   * 地図表示用の掲示場位置情報を全件取得
   */
  findAllWithLocation(
    options?: FindBoardLocationsOptions
  ): Promise<BoardLocation[]>;

  /**
   * IDで掲示場を取得
   */
  findById(id: string): Promise<Board | null>;

  /**
   * 掲示場を更新
   */
  update(board: Board): Promise<void>;

  /**
   * 自治体内で掲示場番号の重複をチェック
   */
  existsByBoardNumberInMunicipality(
    municipalityId: string,
    boardNumber: string,
    excludeBoardId?: string
  ): Promise<boolean>;

  /**
   * 位置情報で検索（PostGIS空間検索）
   */
  findByLocation(options: FindByLocationOptions): Promise<BoardLocation[]>;

  /**
   * 市区町村で検索
   */
  findByMunicipality(
    options: FindByMunicipalityOptions
  ): Promise<BoardLocation[]>;
}
