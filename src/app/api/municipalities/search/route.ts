import { resolve } from "@/shared/lib/di";
import { TOKENS } from "@/shared/lib/di/tokens";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = (searchParams.get("q") ?? "").trim();
  const takeParam = Number(searchParams.get("take") ?? "10");
  const take = Number.isFinite(takeParam)
    ? Math.min(Math.max(takeParam, 1), 30)
    : 10;

  const municipalityRepository = resolve(TOKENS.MunicipalityRepository);

  const municipalities = await municipalityRepository.findAll({
    search: query || undefined,
    take,
    skip: 0,
  });

  return NextResponse.json({
    municipalities: municipalities.map((municipality) => ({
      id: municipality.id,
      name: municipality.name,
      prefecture: municipality.prefecture,
      code: municipality.code.toString(),
    })),
  });
}
