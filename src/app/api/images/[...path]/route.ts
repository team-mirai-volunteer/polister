import { resolve } from "@/shared/lib/di";
import { TOKENS } from "@/shared/lib/di/tokens";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

/**
 * Sanitize and validate storage path to prevent path traversal attacks
 */
function sanitizeStoragePath(pathSegments: string[]): string | null {
  // Reject empty paths
  if (pathSegments.length === 0) {
    return null;
  }

  // Reject any segment containing ".." or starting with "/"
  for (const segment of pathSegments) {
    if (segment.includes("..") || segment.startsWith("/") || segment === ".") {
      return null;
    }
  }

  const relativePath = pathSegments.join("/");

  // Normalize path and ensure it doesn't escape root
  const normalized = path.normalize(relativePath);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    return null;
  }

  return normalized;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    // Sanitize path to prevent path traversal
    const relativePath = sanitizeStoragePath(pathSegments);
    if (!relativePath) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // TODO: 認証チェック（将来実装）
    // const session = await getServerSession();
    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const storageService = resolve(TOKENS.StorageService);

    // ファイル存在チェック
    const exists = await storageService.exists(relativePath);
    if (!exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // ファイル取得
    const fileBuffer = await storageService.get(relativePath);

    // Content-Typeを判定
    const contentType = getContentType(relativePath);

    // レスポンス作成
    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable", // 1年キャッシュ
      },
    });
  } catch (error) {
    console.error("画像配信エラー:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}
