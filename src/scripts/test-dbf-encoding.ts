/**
 * DBFファイルのエンコーディングテストスクリプト
 *
 * DBFFileから日本語が正しく読み込めるかテストします
 */

import DBFFile from "dbffile";

const dbfPath = "./scripts/data/N03-20250101.dbf";

async function testDBFEncoding() {
  console.log("=== DBFエンコーディングテスト ===");
  console.log("");

  // テスト1: UTF-8として読み込み（デフォルト）
  console.log("テスト1: encoding指定なし（デフォルト）");
  console.log("---");
  const dbf1 = await DBFFile.open(dbfPath);
  const records1 = await dbf1.readRecords(10);

  for (let i = 0; i < records1.length; i++) {
    const rec = records1[i];
    const prefecture = rec.N03_001 as string;
    const name = rec.N03_004 as string;
    const code = rec.N03_007 as string;
    console.log(`${i + 1}. ${prefecture} ${name} (${code})`);
  }
  console.log("");

  // テスト2: 明示的にUTF-8を指定
  console.log("テスト2: encoding: 'utf-8' を指定");
  console.log("---");
  const dbf2 = await DBFFile.open(dbfPath, { encoding: "utf-8" });
  const records2 = await dbf2.readRecords(10);

  for (let i = 0; i < records2.length; i++) {
    const rec = records2[i];
    const prefecture = rec.N03_001 as string;
    const name = rec.N03_004 as string;
    const code = rec.N03_007 as string;
    console.log(`${i + 1}. ${prefecture} ${name} (${code})`);
  }
  console.log("");

  // テスト3: 特定の市区町村コードを検索
  console.log("テスト3: 特定の市区町村を確認");
  console.log("---");
  const dbf3 = await DBFFile.open(dbfPath, { encoding: "utf-8" });
  const allRecords = await dbf3.readRecords();

  const testCodes = ["01101", "13101", "27128", "40130"];
  const testData = allRecords.filter((rec) =>
    testCodes.includes(rec.N03_007 as string)
  );

  for (const rec of testData) {
    const prefecture = rec.N03_001 as string;
    const name = rec.N03_004 as string;
    const code = rec.N03_007 as string;
    console.log(`  ${code}: ${prefecture} ${name}`);
  }
  console.log("");

  console.log("=== テスト完了 ===");
  console.log("");
  console.log("結論: DBFファイルは既にUTF-8エンコーディングです");
  console.log("→ encoding: 'utf-8' を指定して読み込めばOK");
}

testDBFEncoding().catch(console.error);
