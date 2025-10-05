import { PrismaClient } from "@prisma/client";
import "reflect-metadata";
import { DependencyContainer, container } from "tsyringe";

import { TOKENS } from "./tokens";
import type {
  AppLogger,
  DateProvider,
  ResolveToken,
  Token,
  TokenMap,
} from "./tokens";

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

const getPrismaClient = (): PrismaClient => {
  if (!globalForPrisma.prismaClient) {
    globalForPrisma.prismaClient = new PrismaClient();
  }

  return globalForPrisma.prismaClient;
};

const registerDefaults = (target: DependencyContainer): void => {
  if (!target.isRegistered(TOKENS.prismaClient)) {
    target.registerInstance(TOKENS.prismaClient, getPrismaClient());
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
