/**
 * GetPrefectureByCodeUseCase
 *
 * 都道府県詳細を取得するユースケース
 */

import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";

import type { PrefectureDetail } from "../../domain/entities/PrefectureDetail";
import type { IPrefectureRepository } from "../../domain/repositories/IPrefectureRepository";

@injectable()
export class GetPrefectureByCodeUseCase {
  constructor(
    @inject(TOKENS.PrefectureRepository)
    private readonly repository: IPrefectureRepository
  ) {}

  async execute(code: string): Promise<PrefectureDetail | null> {
    const normalized = code.trim();

    if (!/^\d{1,2}$/.test(normalized)) {
      return null;
    }

    const numericCode = Number(normalized);
    if (!Number.isInteger(numericCode) || numericCode < 1 || numericCode > 47) {
      return null;
    }

    return this.repository.findByCode(normalized.padStart(2, "0"));
  }
}
