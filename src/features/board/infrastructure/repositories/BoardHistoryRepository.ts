/**
 * BoardHistory Repository 実装
 */

import type {
  BoardHistory,
  CreateBoardHistoryCommand,
} from "@/features/board/domain/entities/BoardHistory";
import { BoardHistory as BoardHistoryEntity } from "@/features/board/domain/entities/BoardHistory";
import type { IBoardHistoryRepository } from "@/features/board/domain/repositories/IBoardHistoryRepository";
import { TOKENS } from "@/shared/lib/di/tokens";
import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { inject, injectable } from "tsyringe";

@injectable()
export class BoardHistoryRepository implements IBoardHistoryRepository {
  constructor(
    @inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient
  ) {}

  async create(command: CreateBoardHistoryCommand): Promise<BoardHistory> {
    const row = await this.prisma.boardHistory.create({
      data: {
        boardId: command.boardId,
        importBatchId: command.importBatchId ?? null,
        beforeData: command.beforeData
          ? (command.beforeData as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        afterData: command.afterData as unknown as Prisma.InputJsonValue,
        changeReason: command.changeReason,
        userId: command.userId ?? null,
        comment: command.comment ?? null,
      },
    });

    // beforeDataがPrisma.JsonNull、null、undefinedの場合はnullに変換
    const beforeData =
      (row.beforeData as unknown) === Prisma.JsonNull ||
      row.beforeData === null ||
      row.beforeData === undefined
        ? null
        : (row.beforeData as unknown as BoardHistory["beforeData"]);

    return new BoardHistoryEntity({
      id: row.id,
      boardId: row.boardId,
      importBatchId: row.importBatchId,
      beforeData,
      afterData: row.afterData as unknown as BoardHistory["afterData"],
      changeReason: row.changeReason as BoardHistory["changeReason"],
      userId: row.userId,
      comment: row.comment,
      changedAt: row.changedAt,
    });
  }

  async findByBoardId(
    boardId: string,
    limit: number = 20
  ): Promise<BoardHistory[]> {
    const rows = await this.prisma.boardHistory.findMany({
      where: { boardId },
      orderBy: { changedAt: "desc" },
      take: limit,
    });

    return rows.map((row) => {
      // beforeDataがPrisma.JsonNull、null、undefinedの場合はnullに変換
      const beforeData =
        (row.beforeData as unknown) === Prisma.JsonNull ||
        row.beforeData === null ||
        row.beforeData === undefined
          ? null
          : (row.beforeData as unknown as BoardHistory["beforeData"]);

      return new BoardHistoryEntity({
        id: row.id,
        boardId: row.boardId,
        importBatchId: row.importBatchId,
        beforeData,
        afterData: row.afterData as unknown as BoardHistory["afterData"],
        changeReason: row.changeReason as BoardHistory["changeReason"],
        userId: row.userId,
        comment: row.comment,
        changedAt: row.changedAt,
      });
    });
  }
}
