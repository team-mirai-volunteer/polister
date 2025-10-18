import type { IMunicipalityRepository } from "@/features/municipality/domain/repositories/IMunicipalityRepository";
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
} as const;

export type Token = (typeof TOKENS)[keyof typeof TOKENS];

export type TokenMap = {
  [TOKENS.PrismaClient]: PrismaClient;
  [TOKENS.Logger]: AppLogger;
  [TOKENS.DateProvider]: DateProvider;
  [TOKENS.MunicipalityRepository]: IMunicipalityRepository;
};

export type ResolveToken<T extends Token> = TokenMap[T];
