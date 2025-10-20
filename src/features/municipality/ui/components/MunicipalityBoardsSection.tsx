"use client";

import { Box } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

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
      return null;
    });
  }, [boards]);

  const focusedBoardId = useMemo(() => {
    if (boards.length === 0) {
      return null;
    }
    if (!selectedBoardId) {
      return null;
    }
    return boards.some((board) => board.id === selectedBoardId)
      ? selectedBoardId
      : null;
  }, [boards, selectedBoardId]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minHeight: 360,
      }}
    >
      <Box sx={{ flexGrow: 1, minHeight: 360 }}>
        <MunicipalityBoardsMap
          boards={boards}
          geojson={geojson ?? undefined}
          focusedBoardId={focusedBoardId}
          onBoardFocused={setSelectedBoardId}
        />
      </Box>
      <Box
        sx={{
          flexBasis: 260,
          flexGrow: 0,
          maxHeight: "calc(100vh - 520px)",
        }}
      >
        <MunicipalityBoardsTable
          boards={boards}
          selectedBoardId={focusedBoardId}
          onSelectBoard={setSelectedBoardId}
        />
      </Box>
    </Box>
  );
};
