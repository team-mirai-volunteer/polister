/**
 * UpdateBoardUseCase
 *
 * 掲示板情報を更新し、変更履歴を記録するユースケース
 */

import type { UpdateBoardCommand } from "@/features/board/domain/aggregates/Board";
import type { ChangeReason } from "@/features/board/domain/entities/BoardHistory";
import type { IBoardHistoryRepository } from "@/features/board/domain/repositories/IBoardHistoryRepository";
import type { IBoardRepository } from "@/features/board/domain/repositories/IBoardRepository";
import { normalizeBoardNumber } from "@/shared/domain/board/BoardNumber";
import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";

export interface UpdateBoardInput {
  boardId: string;
  boardNumber?: string | null;
  name?: string | null;
  address?: string;
  coordinates?: { latitude: number; longitude: number };
  status?: "PENDING" | "VERIFIED" | "REJECTED";
  trustLevel?: "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4";
  note?: string | null;
  changeReason: ChangeReason;
  userId?: string | null;
  comment?: string | null;
}

export class UpdateBoardError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "UpdateBoardError";
  }
}

@injectable()
export class UpdateBoardUseCase {
  constructor(
    @inject(TOKENS.BoardRepository)
    private readonly boardRepository: IBoardRepository,
    @inject(TOKENS.BoardHistoryRepository)
    private readonly boardHistoryRepository: IBoardHistoryRepository
  ) {}

  async execute(input: UpdateBoardInput): Promise<void> {
    // 掲示板を取得
    const board = await this.boardRepository.findById(input.boardId);

    if (!board) {
      throw new UpdateBoardError("掲示板が見つかりません。", "BOARD_NOT_FOUND");
    }

    // 変更前のスナップショットを取得
    const beforeData = board.toSnapshot();

    // 掲示板番号の正規化と重複チェック
    let normalizedBoardNumber: string | null = null;
    if (input.boardNumber !== undefined) {
      normalizedBoardNumber = normalizeBoardNumber(input.boardNumber);

      // 重複チェック（自分自身を除外）
      if (normalizedBoardNumber !== null) {
        const exists =
          await this.boardRepository.existsByBoardNumberInMunicipality(
            board.municipalityId,
            normalizedBoardNumber,
            board.id
          );

        if (exists) {
          throw new UpdateBoardError(
            "この掲示板番号は既に同じ自治体内で使用されています。",
            "BOARD_NUMBER_DUPLICATE"
          );
        }
      }
    }

    // 更新コマンドを構築
    const command: UpdateBoardCommand = {};

    if (input.boardNumber !== undefined) {
      command.boardNumber = normalizedBoardNumber;
    }

    if (input.name !== undefined) {
      command.name = input.name;
    }

    if (input.address !== undefined) {
      command.address = input.address;
    }

    if (input.coordinates !== undefined) {
      command.coordinates = input.coordinates;
    }

    if (input.status !== undefined) {
      command.status = input.status;
    }

    if (input.trustLevel !== undefined) {
      command.trustLevel = input.trustLevel;
    }

    if (input.note !== undefined) {
      command.note = input.note;
    }

    // 掲示板を更新
    board.update(command);

    // 変更後のスナップショットを取得
    const afterData = board.toSnapshot();

    // リポジトリに保存
    await this.boardRepository.update(board);

    // 変更履歴を記録
    await this.boardHistoryRepository.create({
      boardId: board.id,
      beforeData,
      afterData,
      changeReason: input.changeReason,
      userId: input.userId,
      comment: input.comment,
    });
  }
}
