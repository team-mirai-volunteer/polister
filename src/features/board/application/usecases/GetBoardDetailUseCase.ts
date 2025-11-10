/**
 * GetBoardDetailUseCase
 *
 * 掲示板の詳細情報を取得するユースケース
 */

import type { BoardImage } from "@/features/board-image/domain/entities/BoardImage";
import type { IBoardImageRepository } from "@/features/board-image/domain/repositories/IBoardImageRepository";
import type { Board } from "@/features/board/domain/aggregates/Board";
import type { BoardHistory } from "@/features/board/domain/entities/BoardHistory";
import type { IBoardHistoryRepository } from "@/features/board/domain/repositories/IBoardHistoryRepository";
import type { IBoardRepository } from "@/features/board/domain/repositories/IBoardRepository";
import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";

export interface GetBoardDetailResult {
  board: Board;
  histories: BoardHistory[];
  images: BoardImage[];
}

@injectable()
export class GetBoardDetailUseCase {
  constructor(
    @inject(TOKENS.BoardRepository)
    private readonly boardRepository: IBoardRepository,
    @inject(TOKENS.BoardHistoryRepository)
    private readonly boardHistoryRepository: IBoardHistoryRepository,
    @inject(TOKENS.BoardImageRepository)
    private readonly boardImageRepository: IBoardImageRepository
  ) {}

  async execute(boardId: string): Promise<GetBoardDetailResult | null> {
    // 掲示板を取得
    const board = await this.boardRepository.findById(boardId);

    if (!board) {
      return null;
    }

    // 変更履歴を取得（最新20件）
    const histories = await this.boardHistoryRepository.findByBoardId(
      boardId,
      20
    );

    const images = await this.boardImageRepository.findByBoardId(boardId);

    return {
      board,
      histories,
      images,
    };
  }
}
