/**
 * GetPrefecturesUseCase
 *
 * 都道府県一覧を取得するユースケース
 */

import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";

import type { Prefecture } from "../../domain/entities/Prefecture";
import type { IPrefectureRepository } from "../../domain/repositories/IPrefectureRepository";

@injectable()
export class GetPrefecturesUseCase {
  constructor(
    @inject(TOKENS.PrefectureRepository)
    private readonly repository: IPrefectureRepository
  ) {}

  async execute(): Promise<Prefecture[]> {
    return this.repository.findAll();
  }
}
