import { resolve } from "@/shared/lib/di";
import { TOKENS } from "@/shared/lib/di/tokens";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");

  const latitude = latParam !== null ? Number(latParam) : NaN;
  const longitude = lngParam !== null ? Number(lngParam) : NaN;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json(
      { error: "lat and lng query parameters are required" },
      { status: 400 }
    );
  }

  const municipalityRepository = resolve(TOKENS.MunicipalityRepository);
  const result = await municipalityRepository.findNearestByCoordinates({
    latitude,
    longitude,
  });

  if (!result) {
    return NextResponse.json({
      municipality: null,
      distanceMeters: null,
      isInside: false,
    });
  }

  return NextResponse.json({
    municipality: {
      id: result.municipality.id,
      name: result.municipality.name,
      prefecture: result.municipality.prefecture,
      code: result.municipality.code.toString(),
    },
    distanceMeters: result.distanceMeters,
    isInside: result.isInside,
  });
}
