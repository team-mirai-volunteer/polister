"use server";

import { resolve } from "@/shared/lib/di";
import { TOKENS } from "@/shared/lib/di/tokens";
import { revalidatePath } from "next/cache";

export async function updateBoardNumberAction(
  imageId: string,
  boardNumber: string
): Promise<{ success: boolean; message: string }> {
  try {
    const repository = resolve(TOKENS.BoardImageRepository);

    // csvBoardNumber を更新
    await repository.update(imageId, {
      csvBoardNumber: boardNumber.trim() || null,
    } as never);

    // キャッシュ再検証（候補掲示板を再計算）
    revalidatePath(`/board-images/${imageId}`);

    return {
      success: true,
      message: "掲示板番号を更新しました",
    };
  } catch (error) {
    console.error("updateBoardNumberAction error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "更新に失敗しました",
    };
  }
}
