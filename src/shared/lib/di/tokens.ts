import type { BoardImportStorage } from "@/features/board-import/application/services/BoardImportStorage";
import type { IBoardImportRepository } from "@/features/board-import/domain/repositories/IBoardImportRepository";
import type { IBoardRepository } from "@/features/board/domain/repositories/IBoardRepository";
import type { IMunicipalityRepository } from "@/features/municipality/domain/repositories/IMunicipalityRepository";
import type { IPrefectureRepository } from "@/features/prefecture/domain/repositories/IPrefectureRepository";
import type { IStatisticsRepository } from "@/features/statistics/domain/repositories/IStatisticsRepository";
import type { PrismaClient } from "@prisma/client";

export interface AppLogger {
  debug(message: string, ...meta: unknown[]): void;
  info(message: string, ...meta: unknown[]): void;
  warn(message: string, ...meta: unknown[]): void;
  error(message: string | Error, ...meta: unknown[]): void;
}

export interface DateProvider {
  now(): Date;
}

export const TOKENS = {
  PrismaClient: "di.prismaClient",
  Logger: "di.logger",
  DateProvider: "di.dateProvider",
  MunicipalityRepository: "di.municipalityRepository",
  PrefectureRepository: "di.prefectureRepository",
  BoardRepository: "di.boardRepository",
  BoardImportRepository: "di.boardImportRepository",
  BoardImportStorage: "di.boardImportStorage",
  StatisticsRepository: "di.statisticsRepository",
} as const;

export type Token = (typeof TOKENS)[keyof typeof TOKENS];

export type TokenMap = {
  [TOKENS.PrismaClient]: PrismaClient;
  [TOKENS.Logger]: AppLogger;
  [TOKENS.DateProvider]: DateProvider;
  [TOKENS.MunicipalityRepository]: IMunicipalityRepository;
  [TOKENS.PrefectureRepository]: IPrefectureRepository;
  [TOKENS.BoardRepository]: IBoardRepository;
  [TOKENS.BoardImportRepository]: IBoardImportRepository;
  [TOKENS.BoardImportStorage]: BoardImportStorage;
  [TOKENS.StatisticsRepository]: IStatisticsRepository;
};

export type ResolveToken<T extends Token> = TokenMap[T];
