import { resolve } from "@/shared/lib/di";
import { TOKENS } from "@/shared/lib/di/tokens";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import path from "node:path";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function sanitizeSegment(input: string | null | undefined): string {
  if (!input) {
    return "unknown";
  }
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9ぁ-んァ-ヶ一-龠ー-]+/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50) || "unknown"
  );
}

function sanitizeFilename(filename: string | undefined): string {
  if (!filename) {
    return "upload";
  }
  return (
    filename.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 100) || "upload"
  );
}

function resolveExtension(file: File): string {
  const ext = path.extname(file.name || "").toLowerCase();
  if (ext) {
    return ext;
  }
  switch (file.type) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return ".jpg";
  }
}

const sanitizeCoordinate = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

interface ExtractedGPS {
  latitude: number | null;
  longitude: number | null;
  timestamp: Date | null;
}

async function extractGPSFromBuffer(buffer: Buffer): Promise<ExtractedGPS> {
  const exifParser = resolve(TOKENS.ExifParserService);
  const primary = await exifParser.extractGPS(buffer);

  const latitude = sanitizeCoordinate(primary.latitude);
  const longitude = sanitizeCoordinate(primary.longitude);
  const timestamp = primary.timestamp ?? null;

  if (latitude !== null || longitude !== null) {
    return { latitude, longitude, timestamp };
  }

  try {
    const exifr = await import("exifr");
    const gps = await exifr.gps(buffer);
    const fallbackTimestamp = (gps as { DateTimeOriginal?: string | Date })
      ?.DateTimeOriginal;

    return {
      latitude: sanitizeCoordinate(gps?.latitude),
      longitude: sanitizeCoordinate(gps?.longitude),
      timestamp: fallbackTimestamp ? new Date(fallbackTimestamp) : timestamp,
    };
  } catch (error) {
    console.warn("Exif fallback parsing failed", error);
    return { latitude, longitude, timestamp };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const municipalityId = formData.get("municipalityId");
    const file = formData.get("file");

    if (!municipalityId || typeof municipalityId !== "string") {
      return NextResponse.json({ error: "自治体は必須です" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "画像ファイルを選択してください" },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "空のファイルはアップロードできません" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ファイルサイズは20MB以内にしてください" },
        { status: 400 }
      );
    }

    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "対応していない画像形式です" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const municipalityRepository = resolve(TOKENS.MunicipalityRepository);
    const boardImageRepository = resolve(TOKENS.BoardImageRepository);
    const storageService = resolve(TOKENS.StorageService);
    const resizeService = resolve(TOKENS.ImageResizeService);

    const municipality = await municipalityRepository.findById(municipalityId);
    if (!municipality) {
      return NextResponse.json(
        { error: "自治体が見つかりません" },
        { status: 404 }
      );
    }

    const safePrefecture = sanitizeSegment(municipality.prefecture);
    const safeCity = sanitizeSegment(municipality.name);
    const basePath = `board-images/${safePrefecture}/${safeCity}`;

    const uniqueId = randomUUID();
    const originalExt = resolveExtension(file);
    const sanitizedOriginalName = `${sanitizeFilename(
      path.parse(file.name ?? "").name
    )}${originalExt}`;

    const originalPath = `${basePath}/original/${uniqueId}_${sanitizedOriginalName}`;
    const displayPath = `${basePath}/display/${uniqueId}_display.jpg`;
    const thumbnailPath = `${basePath}/thumbnail/${uniqueId}_thumb.jpg`;

    const resized = await resizeService.resizeImage(buffer);
    await storageService.save(resized.original, originalPath);
    await storageService.save(resized.display, displayPath);
    await storageService.save(resized.thumbnail, thumbnailPath);

    const {
      latitude: exifLatitude,
      longitude: exifLongitude,
      timestamp: exifTimestamp,
    } = await extractGPSFromBuffer(buffer);

    const boardImage = await boardImageRepository.create({
      originalFilename: sanitizedOriginalName,
      originalPath,
      displayPath,
      thumbnailPath,
      csvPrefecture: municipality.prefecture,
      csvCity: municipality.name,
      latitude: exifLatitude ?? undefined,
      longitude: exifLongitude ?? undefined,
      takenAt: exifTimestamp ?? undefined,
      uploadedAt: new Date(),
      verificationStatus: "PENDING",
      statusNote: "ユーザーアップロード",
    });

    const previewPath =
      boardImage.displayPath ??
      boardImage.thumbnailPath ??
      boardImage.originalPath;
    const previewUrl = await storageService.getPublicUrl(previewPath);

    return NextResponse.json(
      {
        image: {
          id: boardImage.id,
          previewUrl,
          originalUrl: await storageService.getPublicUrl(
            boardImage.originalPath
          ),
          displayPath: boardImage.displayPath,
          thumbnailPath: boardImage.thumbnailPath,
          latitude: boardImage.latitude,
          longitude: boardImage.longitude,
          municipality: {
            id: municipality.id,
            name: municipality.name,
            prefecture: municipality.prefecture,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("画像アップロード失敗", error);
    return NextResponse.json(
      { error: "画像アップロードに失敗しました" },
      { status: 500 }
    );
  }
}
