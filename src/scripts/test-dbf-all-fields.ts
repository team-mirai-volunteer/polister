/**
 * DBF全フィールド確認スクリプト
 */

import DBFFile from "dbffile";

async function checkAllFields() {
  const dbf = await DBFFile.open("./scripts/data/N03-20250101.dbf", {
    encoding: "utf-8",
  });

  // フィールド定義を確認
  console.log("フィールド定義:");
  console.log("---");
  dbf.fields.forEach((field) => {
    console.log(`  ${field.name}: ${field.type} (size: ${field.size})`);
  });
  console.log("");

  const records = await dbf.readRecords(15);

  console.log("最初の15件のデータ:");
  console.log("---");

  records.forEach((r, i) => {
    const fields = Object.keys(r)
      .map((key) => `${key}="${r[key]}"`)
      .join(" ");
    console.log(`${i + 1}. ${fields}`);
  });
}

checkAllFields().catch(console.error);
