/**
 * GetMunicipalitiesUseCase
 *
 * 自治体一覧を取得するユースケース
 */

import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";
import type { Municipality } from "../../domain/entities/Municipality";
import type {
  IMunicipalityRepository,
  MunicipalityFilter,
} from "../../domain/repositories/IMunicipalityRepository";

export interface GetMunicipalitiesInput {
  page?: number;
  limit?: number;
  prefecture?: string;
  search?: string;
  status?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  filterField?: string;
  filterOperator?: string;
  filterValue?: string;
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

    const filters = this.buildFilters(input);
    const orderBy = this.buildOrderBy(input);

    const shouldOmitPrefecture = filters.some(
      (filter) => filter.field === "prefecture"
    );
    const shouldOmitStatus = filters.some(
      (filter) => filter.field === "status"
    );

    const [municipalities, total] = await Promise.all([
      this.repository.findAll({
        skip,
        take: limit,
        prefecture: shouldOmitPrefecture ? undefined : input.prefecture,
        search: input.search,
        status: shouldOmitStatus ? undefined : input.status,
        filters: filters.length > 0 ? filters : undefined,
        orderBy,
      }),
      this.repository.count({
        prefecture: shouldOmitPrefecture ? undefined : input.prefecture,
        search: input.search,
        status: shouldOmitStatus ? undefined : input.status,
        filters: filters.length > 0 ? filters : undefined,
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

  private buildFilters(input: GetMunicipalitiesInput): MunicipalityFilter[] {
    const filters: MunicipalityFilter[] = [];

    const field = this.normalizeField(input.filterField);

    if (field) {
      const operator = input.filterOperator;
      const value = input.filterValue ?? "";

      if (value || operator === "isEmpty" || operator === "isNotEmpty") {
        filters.push({ field, operator, value });
      }
    }

    return filters;
  }

  private buildOrderBy(input: GetMunicipalitiesInput): FindOrderBy | undefined {
    const field = this.normalizeField(input.sortField);

    if (!field) {
      return undefined;
    }

    const direction = input.sortOrder === "desc" ? "desc" : "asc";

    return { field, direction };
  }

  private normalizeField(
    value: string | undefined
  ): MunicipalityFilter["field"] | undefined {
    if (!value) {
      return undefined;
    }

    const allowedFields: MunicipalityFilter["field"][] = [
      "code",
      "name",
      "prefecture",
      "status",
      "boardCount",
    ];

    return allowedFields.includes(value as MunicipalityFilter["field"])
      ? (value as MunicipalityFilter["field"])
      : undefined;
  }
}

interface FindOrderBy {
  field: MunicipalityFilter["field"];
  direction: "asc" | "desc";
}
