import "reflect-metadata";

import { PrismaClient } from "@prisma/client";
import { container, DependencyContainer } from "tsyringe";

import type {
  AppLogger,
  DateProvider,
  ResolveToken,
  Token,
  TokenMap,
} from "./tokens";
import { TOKENS } from "./tokens";

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
};

const isPrismaDisabled = process.env.DISABLE_PRISMA === "true";

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
          "Prisma Client の生成に失敗しました。`prisma.schema` のパスが正しいか確認し、`yarn db:generate` を実行してください。",
        ].join("\n");
      }

      throw error;
    }
  }

  return globalForPrisma.prismaClient;
};

const registerDefaults = (target: DependencyContainer): void => {
  if (!target.isRegistered(TOKENS.prismaClient)) {
    target.register<PrismaClient>(TOKENS.prismaClient, {
      useFactory: getPrismaClient,
    });
  }

  if (!target.isRegistered(TOKENS.logger)) {
    target.registerSingleton<AppLogger>(TOKENS.logger, ConsoleLogger);
  }

  if (!target.isRegistered(TOKENS.dateProvider)) {
    target.registerSingleton<DateProvider>(
      TOKENS.dateProvider,
      SystemDateProvider
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
