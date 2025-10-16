// Prisma Clientのテスト
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

// .envファイルから環境変数を手動で読み込み
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/DATABASE_URL\s*=\s*["']?([^"'\n]+)["']?/);
  if (match && match[1]) {
    process.env.DATABASE_URL = match[1];
  }
}

console.log("DATABASE_URL:", process.env.DATABASE_URL);

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function test() {
  try {
    const count = await prisma.municipality.count();
    console.log("✓ Municipalitiesの件数:", count);

    await prisma.$disconnect();
  } catch (error) {
    console.error("✗ エラー:", error);
    process.exit(1);
  }
}

test();
