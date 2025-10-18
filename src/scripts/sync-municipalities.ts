/**
 * 国土数値情報 行政区域データの同期スクリプト（完全TypeScript版）
 *
 * ダウンロード → 解凍 → Shapefile読み込み → DB挿入まで一貫処理
 *
 * 使用方法:
 *   yarn municipalities:sync
 *
 * 特徴:
 *   - 完全にTypeScriptで実装（本番環境でも実行可能）
 *   - ogr2ogrなどの外部ツール不要
 *   - ストリーミング処理でメモリ効率的
 *   - バッチ処理で高速インポート
 *   - UTF-8エンコーディング対応
 */

// 最初に環境変数を読み込み（PrismaClientより前）
import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import AdmZip from "adm-zip";
import DBFFile from "dbffile";
import * as fs from "fs";
import * as https from "https";
import * as path from "path";
import * as shapefile from "shapefile";
import * as wellknown from "wellknown";

// 設定
const CONFIG = {
  downloadUrl:
    "https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2025/N03-20250101_GML.zip",
  dataDir: "./scripts/data",
  zipFileName: "N03-20250101_GML.zip",
  shapefileBaseName: "N03-20250101",
  batchSize: 100, // 一度に挿入する件数
};

// カラーコード
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
};

interface MunicipalityData {
  name: string;
  code: string;
  prefecture: string;
  wkt: string;
}

/**
 * ファイルをダウンロード
 */
async function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    let downloadedBytes = 0;
    let totalBytes = 0;

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`)
          );
          return;
        }

        totalBytes = parseInt(response.headers["content-length"] || "0", 10);
        const totalMB =
          totalBytes > 0 ? (totalBytes / 1024 / 1024).toFixed(2) : "未知";

        response.on("data", (chunk) => {
          downloadedBytes += chunk.length;
          const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(2);
          const progress =
            totalBytes > 0
              ? ` (${((downloadedBytes / totalBytes) * 100).toFixed(1)}%)`
              : "";
          process.stdout.write(
            `  進捗: ${downloadedMB}MB / ${totalMB}MB${progress}\r`
          );
        });

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          console.log(""); // 改行
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });

    file.on("error", (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

/**
 * ZIPファイルを解凍
 */
function extractZip(zipPath: string, outputDir: string): void {
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(outputDir, true);
}

/**
 * DBFファイルからUTF-8でデコードした属性を読み込み
 */
async function readAttributes(dbfPath: string) {
  // DBFFileでUTF-8エンコーディングを指定して読み込み
  // 国土数値情報のDBFファイルは既にUTF-8で保存されている
  const dbf = await DBFFile.open(dbfPath, { encoding: "utf-8" });
  const records = await dbf.readRecords();

  return records.map((record) => {
    const prefecture = (record.N03_001 as string) || "";
    const city = (record.N03_004 as string) || "";
    const ward = (record.N03_005 as string) || "";
    const code = (record.N03_007 as string) || "";

    // 市区町村名を構築
    // N03_005（区名）がある場合は「市名 + 区名」、ない場合は「市名」のみ
    const name = ward ? `${city}${ward}` : city;

    return {
      N03_001: prefecture,
      N03_004: name,
      N03_007: code,
    };
  });
}

/**
 * Shapefileを読み込み、同じコードのポリゴンをMULTIPOLYGONとして統合
 */
async function* readShapefile(
  shpPath: string,
  dbfPath: string
): AsyncGenerator<MunicipalityData> {
  console.log(`  ${colors.yellow}属性データを読み込み中...${colors.reset}`);
  const attributes = await readAttributes(dbfPath);
  console.log(`  ✓ ${attributes.length} 件の属性を読み込みました`);

  console.log(`  ${colors.yellow}ジオメトリを読み込み中...${colors.reset}`);
  const source = await shapefile.open(shpPath);

  // 市区町村コードごとにポリゴンをグループ化
  const municipalityMap = new Map<
    string,
    {
      name: string;
      code: string;
      prefecture: string;
      wkts: string[];
    }
  >();

  let index = 0;

  while (true) {
    const result = await source.read();
    if (result.done) break;

    const feature = result.value;
    const attr = attributes[index];

    index++;

    // 市区町村名または行政区域コードがない場合はスキップ
    if (!attr || !attr.N03_004 || !attr.N03_007) {
      continue;
    }

    // GeoJSON geometryをWKT形式に変換
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wkt = wellknown.stringify(feature.geometry as any);

    if (!wkt) {
      continue;
    }

    // 市区町村コードでグループ化
    const existing = municipalityMap.get(attr.N03_007);
    if (existing) {
      existing.wkts.push(wkt);
    } else {
      municipalityMap.set(attr.N03_007, {
        name: attr.N03_004,
        code: attr.N03_007,
        prefecture: attr.N03_001,
        wkts: [wkt],
      });
    }

    // 進捗表示（10000件ごと）
    if (index % 10000 === 0) {
      process.stdout.write(
        `  読み込み中: ${index} 件 (市区町村数: ${municipalityMap.size})\r`
      );
    }
  }

  console.log(""); // 改行
  console.log(`  ✓ ${municipalityMap.size} 市区町村のデータを統合`);

  // 市区町村単位でポリゴンを結合してyield
  for (const data of municipalityMap.values()) {
    // 各WKTをGeoJSONに変換してから結合
    const parts = data.wkts
      .map((w) => wellknown.parse(w))
      .filter((g) => g !== null && g !== undefined);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coordinates = parts.flatMap((g: any) =>
      g.type === "Polygon"
        ? [g.coordinates]
        : g.type === "MultiPolygon"
          ? g.coordinates
          : []
    );

    if (coordinates.length === 0) continue;

    const combinedGeo = { type: "MultiPolygon", coordinates };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const combinedWkt = wellknown.stringify(combinedGeo as any);

    yield {
      name: data.name,
      code: data.code,
      prefecture: data.prefecture,
      wkt: combinedWkt,
    };
  }
}

/**
 * データベースにバッチ挿入
 */
async function insertBatch(
  prisma: PrismaClient,
  batch: MunicipalityData[]
): Promise<{ inserted: number; updated: number; errors: number }> {
  let inserted = 0;
  const updated = 0; // 現在は未使用だがログ出力で使用
  let errors = 0;

  for (const data of batch) {
    try {
      await prisma.$executeRaw`
        INSERT INTO municipalities (id, name, code, prefecture, polygon, source, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          ${data.name},
          ${data.code},
          ${data.prefecture},
          ST_Multi(
            ST_CollectionExtract(
              ST_MakeValid(ST_GeomFromText(${data.wkt}, 4326)),
              3
            )
          )::geography,
          'MLIT',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          prefecture = EXCLUDED.prefecture,
          polygon = EXCLUDED.polygon,
          updated_at = CURRENT_TIMESTAMP
      `;
      inserted++;
    } catch (error) {
      // エラーの詳細を表示（最初の3件のみ）
      if (errors < 3) {
        console.error(
          `  ✗ エラー: ${data.prefecture} ${data.name} (${data.code})`
        );
        console.error(
          `    メッセージ: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      errors++;
    }
  }

  return { inserted, updated, errors };
}

/**
 * メイン処理
 */
async function syncMunicipalities() {
  // .envファイルから環境変数を手動で読み込み
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const match = envContent.match(/DATABASE_URL\s*=\s*["']?([^"'\n]+)["']?/);
    if (match && match[1]) {
      process.env.DATABASE_URL = match[1];
    }
  }

  // 環境変数の確認
  if (!process.env.DATABASE_URL) {
    console.error(
      `${colors.red}エラー: DATABASE_URLが設定されていません${colors.reset}`
    );
    console.error("  .envファイルを確認してください");
    process.exit(1);
  }

  // PrismaClientは環境変数から自動的にDATABASE_URLを読み込む
  const prisma = new PrismaClient();

  try {
    console.log(
      `${colors.blue}╔════════════════════════════════════════════════════════╗${colors.reset}`
    );
    console.log(
      `${colors.blue}║   国土数値情報 行政区域データ 同期スクリプト         ║${colors.reset}`
    );
    console.log(
      `${colors.blue}╚════════════════════════════════════════════════════════╝${colors.reset}`
    );
    console.log("");

    // データディレクトリ作成
    if (!fs.existsSync(CONFIG.dataDir)) {
      fs.mkdirSync(CONFIG.dataDir, { recursive: true });
    }

    const zipPath = path.join(CONFIG.dataDir, CONFIG.zipFileName);
    const shpPath = path.join(
      CONFIG.dataDir,
      `${CONFIG.shapefileBaseName}.shp`
    );
    const dbfPath = path.join(
      CONFIG.dataDir,
      `${CONFIG.shapefileBaseName}.dbf`
    );

    // Step 1: ダウンロード
    console.log(`${colors.green}━━━ Step 1/3: ダウンロード ━━━${colors.reset}`);
    console.log(`URL: ${CONFIG.downloadUrl}`);
    console.log("");

    if (fs.existsSync(zipPath)) {
      console.log(`  ✓ ファイルは既に存在します: ${zipPath}`);
      console.log("    スキップします（削除して再実行すると再ダウンロード）");
    } else {
      await downloadFile(CONFIG.downloadUrl, zipPath);
      console.log(`  ${colors.green}✓ ダウンロード完了${colors.reset}`);
    }
    console.log("");

    // Step 2: 解凍
    console.log(`${colors.green}━━━ Step 2/3: 解凍 ━━━${colors.reset}`);

    if (!fs.existsSync(shpPath)) {
      console.log("  解凍中...");
      extractZip(zipPath, CONFIG.dataDir);
      console.log(`  ${colors.green}✓ 解凍完了${colors.reset}`);
    } else {
      console.log(`  ✓ Shapefileは既に存在します: ${shpPath}`);
    }
    console.log("");

    // Step 3: データベースにインポート
    console.log(
      `${colors.green}━━━ Step 3/3: データベースにインポート ━━━${colors.reset}`
    );
    console.log(`  入力: ${shpPath}`);
    console.log("");

    let totalInserted = 0;
    let totalErrors = 0;
    let totalProcessed = 0;

    let batch: MunicipalityData[] = [];

    console.log(`${colors.yellow}Shapefileを読み込み中...${colors.reset}`);

    for await (const data of readShapefile(shpPath, dbfPath)) {
      batch.push(data);

      // バッチサイズに達したら挿入
      if (batch.length >= CONFIG.batchSize) {
        const result = await insertBatch(prisma, batch);
        totalInserted += result.inserted;
        totalErrors += result.errors;
        totalProcessed += batch.length;

        process.stdout.write(
          `  進捗: ${totalProcessed} 件処理済み (挿入: ${totalInserted}, エラー: ${totalErrors})\r`
        );

        batch = [];
      }
    }

    // 残りのバッチを処理
    if (batch.length > 0) {
      const result = await insertBatch(prisma, batch);
      totalInserted += result.inserted;
      totalErrors += result.errors;
      totalProcessed += batch.length;
    }

    console.log(""); // 改行
    console.log("");
    console.log(`${colors.green}✓ インポート完了${colors.reset}`);
    console.log("");

    // データ検証
    console.log(`${colors.cyan}結果サマリー:${colors.reset}`);
    console.log(`  処理件数: ${totalProcessed} 件`);
    console.log(`  新規追加: ${totalInserted} 件`);
    console.log(`  エラー: ${totalErrors} 件`);
    console.log("");

    // データベースの件数確認
    const totalCount = await prisma.municipality.count();
    console.log(`  データベース総件数: ${totalCount} 件`);
    console.log("");

    // 都道府県別件数（上位5件）
    const prefectureCounts = await prisma.$queryRaw<
      Array<{ prefecture: string; count: bigint }>
    >`
      SELECT prefecture, COUNT(*) as count
      FROM municipalities
      GROUP BY prefecture
      ORDER BY count DESC
      LIMIT 5
    `;

    console.log("都道府県別件数（上位5件）:");
    for (const row of prefectureCounts) {
      console.log(`  ${row.prefecture}: ${Number(row.count)} 件`);
    }
    console.log("");

    console.log(
      `${colors.blue}╔════════════════════════════════════════════════════════╗${colors.reset}`
    );
    console.log(
      `${colors.blue}║   ✓ すべての処理が完了しました！                     ║${colors.reset}`
    );
    console.log(
      `${colors.blue}╚════════════════════════════════════════════════════════╝${colors.reset}`
    );
    console.log("");
    console.log("データ確認:");
    console.log("  yarn db:studio");
    console.log("");
  } catch (error) {
    console.error(`${colors.red}致命的エラー:${colors.reset}`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
syncMunicipalities().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
