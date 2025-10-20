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
    return this.repository.findByCode(code);
  }
}
