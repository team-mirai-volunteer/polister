/**
 * 自治体GeoJSON取得 Server Action
 */

"use server";

import { setupDI } from "@/shared/lib/di/container";
import { container } from "tsyringe";
import { ExportMunicipalityGeoJSONUseCase } from "../usecases/ExportMunicipalityGeoJSONUseCase";

export async function getMunicipalityGeoJSONAction(id: string) {
  try {
    // DIコンテナをセットアップ
    setupDI(container);

    const useCase = container.resolve(ExportMunicipalityGeoJSONUseCase);
    const geojson = await useCase.execute(id);

    if (!geojson) {
      return null;
    }

    return geojson;
  } catch (error) {
    console.error(`Error in getMunicipalityGeoJSONAction(${id}):`, error);
    throw new Error("自治体GeoJSONの取得に失敗しました");
  }
}
