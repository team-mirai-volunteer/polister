"use client";

import { formatBoardNumberLabel } from "@/shared/domain/board/BoardNumber";
import {
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import NextLink from "next/link";

import type { MunicipalityBoardDTO } from "../../application/dto/MunicipalityBoardDTO";
import {
  BOARD_STATUS_COLORS,
  BOARD_STATUS_LABELS,
  TRUST_LEVEL_COLORS,
  TRUST_LEVEL_LABELS,
} from "../../constants";

interface MunicipalityBoardsTableProps {
  boards: MunicipalityBoardDTO[];
  selectedBoardId?: string | null;
  onSelectBoard?: (boardId: string) => void;
}

export const MunicipalityBoardsTable = ({
  boards,
  selectedBoardId,
  onSelectBoard,
}: MunicipalityBoardsTableProps) => {
  if (boards.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        掲示板情報は登録されていません。
      </Typography>
    );
  }

  return (
    <Box sx={{ height: "100%", overflowY: "auto" }}>
      <Table size="small" stickyHeader aria-label="掲示板一覧">
        <TableHead>
          <TableRow>
            <TableCell>番号</TableCell>
            <TableCell>名称</TableCell>
            <TableCell>住所</TableCell>
            <TableCell>状態</TableCell>
            <TableCell>信頼度</TableCell>
            <TableCell>詳細</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {boards.map((board) => {
            const isSelected = board.id === selectedBoardId;
            return (
              <TableRow
                key={board.id}
                hover
                selected={isSelected}
                onClick={() => onSelectBoard?.(board.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectBoard?.(board.id);
                  }
                }}
                tabIndex={0}
                aria-selected={isSelected}
                sx={{ cursor: "pointer" }}
              >
                <TableCell width="80">
                  {formatBoardNumberLabel(board.boardNumber)}
                </TableCell>
                <TableCell width="200">{board.name ?? "名称未設定"}</TableCell>
                <TableCell>{board.address}</TableCell>
                <TableCell width="120">
                  <Chip
                    size="small"
                    label={BOARD_STATUS_LABELS[board.status] ?? board.status}
                    color={BOARD_STATUS_COLORS[board.status] ?? "default"}
                  />
                </TableCell>
                <TableCell width="120">
                  <Chip
                    size="small"
                    label={
                      TRUST_LEVEL_LABELS[board.trustLevel] ?? board.trustLevel
                    }
                    color={TRUST_LEVEL_COLORS[board.trustLevel] ?? "info"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell width="120" sx={{ whiteSpace: "nowrap" }}>
                  <Button
                    component={NextLink}
                    href={`/boards/${board.id}`}
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    詳細を見る
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
};
