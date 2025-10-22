/**
 * 都道府県レベルの掲示板マップ
 */

"use client";

import type { BoardLocationDTO } from "@/features/board/application/dto/BoardLocationDTO";
import { BoardsClusterMap } from "@/features/board/ui/components/BoardsClusterMap";

interface PrefectureBoardsMapProps {
  boards: BoardLocationDTO[];
}

export function PrefectureBoardsMap({ boards }: PrefectureBoardsMapProps) {
  return (
    <BoardsClusterMap
      boards={boards}
      minHeight={320}
      sx={{ flex: 1, minHeight: 320 }}
    />
  );
}
