/**
 * DBFフィールド確認スクリプト
 */

import DBFFile from "dbffile";

async function checkDBFFields() {
  const dbf = await DBFFile.open("./scripts/data/N03-20250101.dbf", {
    encoding: "utf-8",
  });
  const records = await dbf.readRecords(15);

  console.log("最初の15件のフィールド:");
  console.log("---");

  records.forEach((r, i) => {
    console.log(
      `${i + 1}. N03_001="${r.N03_001}" N03_002="${r.N03_002}" N03_003="${r.N03_003}" N03_004="${r.N03_004}" N03_007="${r.N03_007}"`
    );
  });

  console.log("");
  console.log("フィールドの意味:");
  console.log("  N03_001: 都道府県名");
  console.log("  N03_002: 振興局名（北海道のみ）");
  console.log("  N03_003: 郡名");
  console.log("  N03_004: 市区町村名");
  console.log("  N03_007: 行政区域コード（5桁）");
}

checkDBFFields().catch(console.error);
