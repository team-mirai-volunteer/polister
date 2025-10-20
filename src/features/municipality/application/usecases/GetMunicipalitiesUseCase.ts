/**
 * GetMunicipalitiesUseCase
 *
 * 自治体一覧を取得するユースケース
 */

import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";
import type { Municipality } from "../../domain/entities/Municipality";
import type { IMunicipalityRepository } from "../../domain/repositories/IMunicipalityRepository";

export interface GetMunicipalitiesInput {
  page?: number;
  limit?: number;
  prefecture?: string;
  search?: string;
  status?: string;
}

export interface GetMunicipalitiesOutput {
  municipalities: Municipality[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

@injectable()
export class GetMunicipalitiesUseCase {
  constructor(
    @inject(TOKENS.MunicipalityRepository)
    private repository: IMunicipalityRepository
  ) {}

  async execute(
    input: GetMunicipalitiesInput
  ): Promise<GetMunicipalitiesOutput> {
    const rawPage = input.page ?? 1;
    const rawLimit = input.limit ?? 50;
    const page = Number.isFinite(rawPage)
      ? Math.max(1, Math.floor(rawPage))
      : 1;
    const limit = Number.isFinite(rawLimit)
      ? Math.max(1, Math.floor(rawLimit))
      : 50;
    const skip = (page - 1) * limit;

    const [municipalities, total] = await Promise.all([
      this.repository.findAll({
        skip,
        take: limit,
        prefecture: input.prefecture,
        search: input.search,
        status: input.status,
      }),
      this.repository.count({
        prefecture: input.prefecture,
        search: input.search,
        status: input.status,
      }),
    ]);

    return {
      municipalities,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }
}
