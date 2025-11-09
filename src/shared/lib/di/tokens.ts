import type { GetBoardCandidatesUseCase } from "@/features/board-image/application/usecases/GetBoardCandidatesUseCase";
import type { ImportBoardImagesFromCSVUseCase } from "@/features/board-image/application/usecases/ImportBoardImagesFromCSVUseCase";
import type { IBoardImageRepository } from "@/features/board-image/domain/repositories/IBoardImageRepository";
import type { BoardMatchingService } from "@/features/board-image/domain/services/BoardMatchingService";
import type { IBoardImportRepository } from "@/features/board-import/domain/repositories/IBoardImportRepository";
import type { IBoardHistoryRepository } from "@/features/board/domain/repositories/IBoardHistoryRepository";
import type { IBoardRepository } from "@/features/board/domain/repositories/IBoardRepository";
import type { IMunicipalityRepository } from "@/features/municipality/domain/repositories/IMunicipalityRepository";
import type { IPrefectureRepository } from "@/features/prefecture/domain/repositories/IPrefectureRepository";
import type { IStatisticsRepository } from "@/features/statistics/domain/repositories/IStatisticsRepository";
import type { ExifParserService } from "@/infrastructure/storage/ExifParserService";
import type { GoogleDriveDownloadService } from "@/infrastructure/storage/GoogleDriveDownloadService";
import type { ImageResizeService } from "@/infrastructure/storage/ImageResizeService";
import type { IStorageService } from "@/infrastructure/storage/IStorageService";
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
  BoardImageRepository: "di.boardImageRepository",
  BoardImportRepository: "di.boardImportRepository",
  BoardHistoryRepository: "di.boardHistoryRepository",
  StatisticsRepository: "di.statisticsRepository",
  StorageService: "di.storageService",
  GoogleDriveDownloadService: "di.googleDriveDownloadService",
  ImageResizeService: "di.imageResizeService",
  ExifParserService: "di.exifParserService",
  BoardMatchingService: "di.boardMatchingService",
  ImportBoardImagesFromCSVUseCase: "di.importBoardImagesFromCSVUseCase",
  GetBoardCandidatesUseCase: "di.getBoardCandidatesUseCase",
} as const;

export type Token = (typeof TOKENS)[keyof typeof TOKENS];

export type TokenMap = {
  [TOKENS.PrismaClient]: PrismaClient;
  [TOKENS.Logger]: AppLogger;
  [TOKENS.DateProvider]: DateProvider;
  [TOKENS.MunicipalityRepository]: IMunicipalityRepository;
  [TOKENS.PrefectureRepository]: IPrefectureRepository;
  [TOKENS.BoardRepository]: IBoardRepository;
  [TOKENS.BoardImageRepository]: IBoardImageRepository;
  [TOKENS.BoardImportRepository]: IBoardImportRepository;
  [TOKENS.BoardHistoryRepository]: IBoardHistoryRepository;
  [TOKENS.StatisticsRepository]: IStatisticsRepository;
  [TOKENS.StorageService]: IStorageService;
  [TOKENS.GoogleDriveDownloadService]: GoogleDriveDownloadService;
  [TOKENS.ImageResizeService]: ImageResizeService;
  [TOKENS.ExifParserService]: ExifParserService;
  [TOKENS.BoardMatchingService]: BoardMatchingService;
  [TOKENS.ImportBoardImagesFromCSVUseCase]: ImportBoardImagesFromCSVUseCase;
  [TOKENS.GetBoardCandidatesUseCase]: GetBoardCandidatesUseCase;
};

export type ResolveToken<T extends Token> = TokenMap[T];
