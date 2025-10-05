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
  prismaClient: "di.prismaClient",
  logger: "di.logger",
  dateProvider: "di.dateProvider",
} as const;

export type Token = (typeof TOKENS)[keyof typeof TOKENS];

export type TokenMap = {
  [TOKENS.prismaClient]: PrismaClient;
  [TOKENS.logger]: AppLogger;
  [TOKENS.dateProvider]: DateProvider;
};

export type ResolveToken<T extends Token> = TokenMap[T];
