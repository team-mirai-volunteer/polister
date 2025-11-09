"use client";

import { useRouter } from "next/navigation";
import type { BoardCandidateDTO } from "../../application/actions/getBoardCandidatesAction";
import { updateBoardImageAction } from "../../application/actions/updateBoardImageAction";
import { BoardCandidateList } from "./BoardCandidateList";

interface BoardCandidateListWrapperProps {
  candidates: BoardCandidateDTO[];
  imageId: string;
}

export function BoardCandidateListWrapper({
  candidates,
  imageId,
}: BoardCandidateListWrapperProps) {
  const router = useRouter();

  const handleLinkPublic = async (boardId: string) => {
    const result = await updateBoardImageAction({
      imageId,
      action: "link_public",
      boardId,
    });

    if (result.success) {
      alert("公開設定で紐付けました");
      router.refresh();
    } else {
      alert(`エラー: ${result.message}`);
    }
  };

  const handleLinkPrivate = async (boardId: string) => {
    const result = await updateBoardImageAction({
      imageId,
      action: "link_private",
      boardId,
    });

    if (result.success) {
      alert("非公開設定で紐付けました");
      router.refresh();
    } else {
      alert(`エラー: ${result.message}`);
    }
  };

  return (
    <BoardCandidateList
      candidates={candidates}
      onLinkPublic={handleLinkPublic}
      onLinkPrivate={handleLinkPrivate}
    />
  );
}
