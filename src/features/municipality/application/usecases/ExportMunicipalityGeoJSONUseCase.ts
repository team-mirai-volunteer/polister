/**
 * ExportMunicipalityGeoJSONUseCase
 *
 * 自治体のポリゴンをGeoJSON形式でエクスポートするユースケース
 */

import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";
import type {
  GeoJSONFeature,
  IMunicipalityRepository,
} from "../../domain/repositories/IMunicipalityRepository";

@injectable()
export class ExportMunicipalityGeoJSONUseCase {
  constructor(
    @inject(TOKENS.MunicipalityRepository)
    private repository: IMunicipalityRepository
  ) {}

  async execute(id: string): Promise<GeoJSONFeature | null> {
    return await this.repository.exportAsGeoJSON(id);
  }
}
