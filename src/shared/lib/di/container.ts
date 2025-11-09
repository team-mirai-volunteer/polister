import "reflect-metadata";

import { PrismaClient } from "@prisma/client";
import { container, DependencyContainer } from "tsyringe";

import { GetBoardCandidatesUseCase } from "@/features/board-image/application/usecases/GetBoardCandidatesUseCase";
import { ImportBoardImagesFromCSVUseCase } from "@/features/board-image/application/usecases/ImportBoardImagesFromCSVUseCase";
import type { IBoardImageRepository } from "@/features/board-image/domain/repositories/IBoardImageRepository";
import { BoardMatchingService } from "@/features/board-image/domain/services/BoardMatchingService";
import { BoardImageRepository } from "@/features/board-image/infrastructure/repositories/BoardImageRepository";
import type { IBoardImportRepository } from "@/features/board-import/domain/repositories/IBoardImportRepository";
import { BoardImportRepository } from "@/features/board-import/infrastructure/repositories/BoardImportRepository";
import type { IBoardHistoryRepository } from "@/features/board/domain/repositories/IBoardHistoryRepository";
import type { IBoardRepository } from "@/features/board/domain/repositories/IBoardRepository";
import { BoardHistoryRepository } from "@/features/board/infrastructure/repositories/BoardHistoryRepository";
import { BoardRepository } from "@/features/board/infrastructure/repositories/BoardRepository";
import type { IMunicipalityRepository } from "@/features/municipality/domain/repositories/IMunicipalityRepository";
import { MunicipalityRepository } from "@/features/municipality/infrastructure/repositories/MunicipalityRepository";
import type { IPrefectureRepository } from "@/features/prefecture/domain/repositories/IPrefectureRepository";
import { PrefectureRepository } from "@/features/prefecture/infrastructure/repositories/PrefectureRepository";
import type { IStatisticsRepository } from "@/features/statistics/domain/repositories/IStatisticsRepository";
import { StatisticsRepository } from "@/features/statistics/infrastructure/repositories/StatisticsRepository";
import { CloudStorageService } from "@/infrastructure/storage/CloudStorageService";
import { ExifParserService } from "@/infrastructure/storage/ExifParserService";
import { GoogleDriveDownloadService } from "@/infrastructure/storage/GoogleDriveDownloadService";
import { ImageResizeService } from "@/infrastructure/storage/ImageResizeService";
import type { IStorageService } from "@/infrastructure/storage/IStorageService";
import { LocalStorageService } from "@/infrastructure/storage/LocalStorageService";
import type {
  AppLogger,
  DateProvider,
  ResolveToken,
  Token,
  TokenMap,
} from "@/shared/lib/di/tokens";
import { TOKENS } from "@/shared/lib/di/tokens";

class ConsoleLogger implements AppLogger {
  debug(message: string, ...meta: unknown[]): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(message, ...meta);
    }
  }

  info(message: string, ...meta: unknown[]): void {
    console.info(message, ...meta);
  }

  warn(message: string, ...meta: unknown[]): void {
    console.warn(message, ...meta);
  }

  error(message: string | Error, ...meta: unknown[]): void {
    if (message instanceof Error) {
      console.error(message.message, message.stack, ...meta);
      return;
    }

    console.error(message, ...meta);
  }
}

class SystemDateProvider implements DateProvider {
  now(): Date {
    return new Date();
  }
}

const globalForPrisma = globalThis as typeof globalThis & {
  prismaClient?: PrismaClient;
  prismaDisconnectRegistered?: boolean;
};

const isPrismaDisabled = process.env.DISABLE_PRISMA === "true";

const registerPrismaShutdownHook = (client: PrismaClient): void => {
  if (typeof process === "undefined") {
    return;
  }

  if (globalForPrisma.prismaDisconnectRegistered) {
    return;
  }

  const disconnect = async (): Promise<void> => {
    try {
      await client.$disconnect();
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          "Prisma Client の切断に失敗しました。",
          error.message,
          error.stack
        );
        return;
      }

      console.error("Prisma Client の切断に失敗しました。", error);
    }
  };

  process.once("beforeExit", () => {
    void disconnect();
  });

  const terminationSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  terminationSignals.forEach((signal) => {
    process.once(signal, () => {
      void disconnect();
    });
  });

  globalForPrisma.prismaDisconnectRegistered = true;
};

const getPrismaClient = (): PrismaClient => {
  if (isPrismaDisabled) {
    throw new Error(
      "Prisma Client は DISABLE_PRISMA=true のため初期化されていません。データベース機能を利用する場合は DISABLE_PRISMA を解除し、必要に応じて `yarn db:generate` を実行してください。"
    );
  }

  if (!globalForPrisma.prismaClient) {
    try {
      globalForPrisma.prismaClient = new PrismaClient();
    } catch (error) {
      if (error instanceof Error) {
        error.message = [
          error.message,
          "Prisma Client の生成に失敗しました。`schema.prisma` のパスが正しいか確認し、`yarn db:generate` を実行してください。",
        ].join("\n");
      }

      throw error;
    }
  }

  const prismaClient = globalForPrisma.prismaClient;
  if (!prismaClient) {
    throw new Error("Prisma Client の初期化に失敗しました。");
  }

  registerPrismaShutdownHook(prismaClient);

  return prismaClient;
};

const registerDefaults = (target: DependencyContainer): void => {
  if (!target.isRegistered(TOKENS.PrismaClient)) {
    target.register<PrismaClient>(TOKENS.PrismaClient, {
      useFactory: getPrismaClient,
    });
  }

  if (!target.isRegistered(TOKENS.Logger)) {
    target.registerSingleton<AppLogger>(TOKENS.Logger, ConsoleLogger);
  }

  if (!target.isRegistered(TOKENS.DateProvider)) {
    target.registerSingleton<DateProvider>(
      TOKENS.DateProvider,
      SystemDateProvider
    );
  }

  // Repositories
  if (!target.isRegistered(TOKENS.MunicipalityRepository)) {
    target.registerSingleton<IMunicipalityRepository>(
      TOKENS.MunicipalityRepository,
      MunicipalityRepository
    );
  }

  if (!target.isRegistered(TOKENS.PrefectureRepository)) {
    target.registerSingleton<IPrefectureRepository>(
      TOKENS.PrefectureRepository,
      PrefectureRepository
    );
  }

  if (!target.isRegistered(TOKENS.BoardRepository)) {
    target.registerSingleton<IBoardRepository>(
      TOKENS.BoardRepository,
      BoardRepository
    );
  }

  if (!target.isRegistered(TOKENS.BoardImageRepository)) {
    target.registerSingleton<IBoardImageRepository>(
      TOKENS.BoardImageRepository,
      BoardImageRepository
    );
  }

  if (!target.isRegistered(TOKENS.BoardImportRepository)) {
    target.registerSingleton<IBoardImportRepository>(
      TOKENS.BoardImportRepository,
      BoardImportRepository
    );
  }

  if (!target.isRegistered(TOKENS.BoardHistoryRepository)) {
    target.registerSingleton<IBoardHistoryRepository>(
      TOKENS.BoardHistoryRepository,
      BoardHistoryRepository
    );
  }

  if (!target.isRegistered(TOKENS.StatisticsRepository)) {
    target.registerSingleton<IStatisticsRepository>(
      TOKENS.StatisticsRepository,
      StatisticsRepository
    );
  }

  // StorageService（環境により切り替え）
  if (!target.isRegistered(TOKENS.StorageService)) {
    const StorageImplementation =
      process.env.NODE_ENV === "production"
        ? CloudStorageService
        : LocalStorageService;

    target.registerSingleton<IStorageService>(
      TOKENS.StorageService,
      StorageImplementation
    );
  }

  // Services
  if (!target.isRegistered(TOKENS.GoogleDriveDownloadService)) {
    target.registerSingleton<GoogleDriveDownloadService>(
      TOKENS.GoogleDriveDownloadService,
      GoogleDriveDownloadService
    );
  }

  if (!target.isRegistered(TOKENS.ImageResizeService)) {
    target.registerSingleton<ImageResizeService>(
      TOKENS.ImageResizeService,
      ImageResizeService
    );
  }

  if (!target.isRegistered(TOKENS.ExifParserService)) {
    target.registerSingleton<ExifParserService>(
      TOKENS.ExifParserService,
      ExifParserService
    );
  }

  if (!target.isRegistered(TOKENS.BoardMatchingService)) {
    target.registerSingleton<BoardMatchingService>(
      TOKENS.BoardMatchingService,
      BoardMatchingService
    );
  }

  // UseCases
  if (!target.isRegistered(TOKENS.ImportBoardImagesFromCSVUseCase)) {
    target.registerSingleton<ImportBoardImagesFromCSVUseCase>(
      TOKENS.ImportBoardImagesFromCSVUseCase,
      ImportBoardImagesFromCSVUseCase
    );
  }

  if (!target.isRegistered(TOKENS.GetBoardCandidatesUseCase)) {
    target.registerSingleton<GetBoardCandidatesUseCase>(
      TOKENS.GetBoardCandidatesUseCase,
      GetBoardCandidatesUseCase
    );
  }
};

export const setupDI = (
  targetContainer: DependencyContainer = container
): DependencyContainer => {
  registerDefaults(targetContainer);

  return targetContainer;
};

export const resolve = <T extends Token>(token: T): ResolveToken<T> => {
  if (!container.isRegistered(token)) {
    setupDI(container);
  }

  return container.resolve<ResolveToken<T>>(token);
};

export const getContainer = (): DependencyContainer => container;

export type { TokenMap };
