"use client";

import { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";

import type { MunicipalityBoardDTO } from "../../application/dto/MunicipalityBoardDTO";
import { MunicipalityBoardsMap } from "./MunicipalityBoardsMap";
import { MunicipalityBoardsTable } from "./MunicipalityBoardsTable";

interface MunicipalityBoardsSectionProps {
  boards: MunicipalityBoardDTO[];
  geojson?: GeoJSON.Feature | null;
}

export const MunicipalityBoardsSection = ({
  boards,
  geojson,
}: MunicipalityBoardsSectionProps) => {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  useEffect(() => {
    if (boards.length === 0) {
      setSelectedBoardId(null);
      return;
    }

    setSelectedBoardId((prev) => {
      if (prev && boards.some((board) => board.id === prev)) {
        return prev;
      }
      return boards[0].id;
    });
  }, [boards]);

  const hasBoards = boards.length > 0;
  const focusedBoardId = useMemo(() => {
    if (!hasBoards) {
      return null;
    }
    return selectedBoardId ?? boards[0]?.id ?? null;
  }, [boards, selectedBoardId, hasBoards]);

  return (
    <Box sx={{
      flexGrow: 1,
      display: "flex",
      flexDirection: "column",
      gap: 2,
      minHeight: 360,
    }}>
      <Box sx={{ flexGrow: 1, minHeight: 360 }}>
        <MunicipalityBoardsMap
          boards={boards}
          geojson={geojson ?? undefined}
          focusedBoardId={focusedBoardId}
          onBoardFocused={setSelectedBoardId}
        />
      </Box>
      <Box sx={{
        flexBasis: 260,
        flexGrow: 0,
        maxHeight: "calc(100vh - 520px)",
      }}>
        <MunicipalityBoardsTable
          boards={boards}
          selectedBoardId={focusedBoardId}
          onSelectBoard={setSelectedBoardId}
        />
      </Box>
    </Box>
  );
};
