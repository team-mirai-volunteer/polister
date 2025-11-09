import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("board_images テーブルをクリアします...");
  const result = await prisma.boardImage.deleteMany({});
  console.log(`${result.count}件のレコードを削除しました`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
