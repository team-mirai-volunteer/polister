import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 紐付けられた画像を確認
  const linkedImages = await prisma.boardImage.findMany({
    where: { boardId: { not: null } },
    select: {
      id: true,
      csvBoardNumber: true,
      boardId: true,
      isPublic: true,
      verificationStatus: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  console.log("\n=== 紐付けられた画像（最新5件） ===");
  for (const img of linkedImages) {
    console.log(`\n画像ID: ${img.id}`);
    console.log(`掲示板ID: ${img.boardId}`);
    console.log(`掲示板番号: ${img.csvBoardNumber}`);
    const publicStatus = img.isPublic ? "公開" : "非公開";
    console.log(`公開状態: ${publicStatus}`);
    console.log(`ステータス: ${img.verificationStatus}`);

    // 実際の掲示板が存在するか確認
    if (img.boardId) {
      const board = await prisma.board.findUnique({
        where: { id: img.boardId },
        select: { id: true, boardNumber: true },
      });

      if (board) {
        console.log(`✓ 掲示板が存在: ${board.boardNumber}`);
      } else {
        console.log(`✗ 掲示板が存在しません！`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
