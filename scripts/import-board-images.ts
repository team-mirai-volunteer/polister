#!/usr/bin/env tsx

import { ImportBoardImagesFromCSVUseCase } from "@/features/board-image/application/usecases/ImportBoardImagesFromCSVUseCase";
import { resolve } from "@/shared/lib/di";
import { TOKENS } from "@/shared/lib/di/tokens";
import { Command } from "commander";
import "reflect-metadata";

const program = new Command();

program
  .name("import-board-images")
  .description(
    "掲示板写真CSVファイルをインポート（Google Driveダウンロード + 3種類リサイズ）"
  )
  .argument("<csv-file>", "CSVファイルパス")
  .option("--limit <number>", "処理件数制限（テスト用）", parseInt)
  .option("--skip-download", "画像ダウンロードをスキップ（メタデータのみ登録）")
  .option(
    "--batch-size <number>",
    "並列ダウンロード数（デフォルト: 10）",
    parseInt,
    10
  )
  .action(
    async (
      csvFile: string,
      options: { limit?: number; skipDownload?: boolean; batchSize?: number }
    ) => {
      console.log("=====================================");
      console.log("掲示板写真 CSVインポート");
      console.log("=====================================");
      console.log(`CSVファイル: ${csvFile}`);
      if (options.limit) {
        console.log(`処理件数制限: ${options.limit}件`);
      }
      if (options.skipDownload) {
        console.log("ダウンロードスキップ: メタデータのみ登録");
      } else {
        console.log(`並列ダウンロード数: ${options.batchSize}件`);
      }
      console.log("");

      try {
        const useCase = resolve(
          TOKENS.ImportBoardImagesFromCSVUseCase
        ) as ImportBoardImagesFromCSVUseCase;

        const result = await useCase.execute(csvFile, {
          limit: options.limit,
          skipDownload: options.skipDownload ?? false,
          batchSize: options.batchSize,
        });

        console.log("");
        console.log("=====================================");
        console.log("インポート完了");
        console.log("=====================================");
        console.log(`総行数: ${result.totalRows}`);
        console.log(`成功: ${result.importedCount}`);
        console.log(`ダウンロード: ${result.downloadedCount}`);
        console.log(`スキップ: ${result.skippedCount}`);
        console.log(`エラー: ${result.errors.length}`);

        if (result.errors.length > 0) {
          console.log("");
          console.log("エラー詳細:");
          result.errors
            .slice(0, 10)
            .forEach((err: { row: number; fileId: string; error: string }) => {
              console.log(`  行${err.row} (${err.fileId}): ${err.error}`);
            });
          if (result.errors.length > 10) {
            console.log(`  ... 他 ${result.errors.length - 10} 件`);
          }
        }

        console.log("");
        process.exit(0);
      } catch (error) {
        console.error("");
        console.error("エラーが発生しました:");
        console.error(error instanceof Error ? error.message : String(error));
        console.error("");
        process.exit(1);
      }
    }
  );

program.parse();
