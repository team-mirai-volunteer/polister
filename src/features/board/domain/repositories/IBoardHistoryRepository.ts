/**
 * BoardHistory Repository インターフェース
 */

import type {
  BoardHistory,
  CreateBoardHistoryCommand,
} from "../entities/BoardHistory";

export interface IBoardHistoryRepository {
  /**
   * 変更履歴を作成
   */
  create(command: CreateBoardHistoryCommand): Promise<BoardHistory>;

  /**
   * 掲示場IDで変更履歴を取得（新しい順）
   */
  findByBoardId(boardId: string, limit?: number): Promise<BoardHistory[]>;
}
