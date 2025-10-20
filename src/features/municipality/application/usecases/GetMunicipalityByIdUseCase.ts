/**
 * GetMunicipalityByIdUseCase
 *
 * IDで自治体を取得するユースケース
 */

import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";
import type { Municipality } from "../../domain/entities/Municipality";
import type { IMunicipalityRepository } from "../../domain/repositories/IMunicipalityRepository";

@injectable()
export class GetMunicipalityByIdUseCase {
  constructor(
    @inject(TOKENS.MunicipalityRepository)
    private repository: IMunicipalityRepository
  ) {}

  async execute(id: string): Promise<Municipality | null> {
    return await this.repository.findById(id);
  }
}
