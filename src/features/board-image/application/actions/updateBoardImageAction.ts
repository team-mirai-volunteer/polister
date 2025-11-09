"use server";

import { resolve } from "@/shared/lib/di";
import { TOKENS } from "@/shared/lib/di/tokens";
import { revalidatePath } from "next/cache";

export type ImageAction =
  | "link_public" // 公開して紐付ける
  | "link_private" // 非公開で紐付ける
  | "unlink" // 紐付け解除（PENDINGに戻す）
  | "no_number" // 番号不明
  | "location_issue" // 位置情報不明
  | "duplicate" // 重複
  | "rejected"; // 対象外（却下）

export interface UpdateBoardImageInput {
  imageId: string;
  action: ImageAction;
  boardId?: string; // link_public, link_private の場合必須
}

export async function updateBoardImageAction(
  input: UpdateBoardImageInput
): Promise<{ success: boolean; message: string }> {
  const repository = resolve(TOKENS.BoardImageRepository);

  try {
    const { imageId, action, boardId } = input;

    // アクションに応じた更新内容を決定
    let updateData: {
      boardId?: string | null;
      verificationStatus: string;
      isPublic: boolean;
    };

    switch (action) {
      case "link_public":
        if (!boardId) {
          throw new Error("boardId is required for link_public action");
        }
        updateData = {
          boardId,
          verificationStatus: "VERIFIED",
          isPublic: true,
        };
        break;

      case "link_private":
        if (!boardId) {
          throw new Error("boardId is required for link_private action");
        }
        updateData = {
          boardId,
          verificationStatus: "VERIFIED",
          isPublic: false,
        };
        break;

      case "no_number":
        updateData = {
          boardId: null,
          verificationStatus: "NO_NUMBER",
          isPublic: false,
        };
        break;

      case "location_issue":
        updateData = {
          boardId: null,
          verificationStatus: "LOCATION_ISSUE",
          isPublic: false,
        };
        break;

      case "duplicate":
        updateData = {
          boardId: null,
          verificationStatus: "DUPLICATE",
          isPublic: false,
        };
        break;

      case "unlink":
        updateData = {
          boardId: null,
          verificationStatus: "PENDING",
          isPublic: false,
        };
        break;

      case "rejected":
        updateData = {
          boardId: null,
          verificationStatus: "REJECTED",
          isPublic: false,
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // 更新実行
    await repository.update(imageId, updateData);

    // キャッシュ再検証
    revalidatePath(`/board-images/${imageId}`);
    revalidatePath("/board-images");

    return {
      success: true,
      message: "更新しました",
    };
  } catch (error) {
    console.error("updateBoardImageAction error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "更新に失敗しました",
    };
  }
}
