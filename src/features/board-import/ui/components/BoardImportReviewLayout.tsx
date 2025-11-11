"use client";

import type {
  BoardImportBatchDTO,
  BoardImportRowDTO,
} from "@/features/board-import/application/dto/BoardImportBatchDTO";
import { compareBoardNumbers } from "@/shared/domain/board/BoardNumber";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

import { BoardImportDeleteButton } from "./BoardImportDeleteButton";
import { BoardImportReviewMap } from "./BoardImportReviewMap";
import { BoardImportReviewTable } from "./BoardImportReviewTable";

export interface BoardImportReviewLayoutProps {
  batch: BoardImportBatchDTO;
  rows: BoardImportRowDTO[];
}

export function BoardImportReviewLayout({
  batch,
  rows,
}: BoardImportReviewLayoutProps) {
  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) =>
        compareBoardNumbers(a.boardNumber, b.boardNumber)
      ),
    [rows]
  );

  const [selectedRowId, setSelectedRowId] = useState<string | null>(
    () => sortedRows[0]?.id ?? null
  );

  const selectedRow = useMemo(() => {
    if (!selectedRowId) {
      return sortedRows[0] ?? null;
    }
    return sortedRows.find((row) => row.id === selectedRowId) ?? null;
  }, [sortedRows, selectedRowId]);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "260px 1fr",
        },
        gridTemplateRows: {
          xs: "auto auto auto",
          lg: "auto 1fr",
        },
        gridTemplateAreas: {
          xs: '"info" "map" "content"',
          lg: '"info map" "content content"',
        },
        columnGap: 3,
        rowGap: 3,
        flexGrow: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          gridArea: "info",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          boxSizing: "border-box",
        }}
      >
        <Typography variant="subtitle2" color="text.secondary">
          バッチ情報
        </Typography>
        <InfoRow label="バッチID">{batch.id}</InfoRow>
        <InfoRow label="アップロード日時">
          {new Date(batch.uploadedAt).toLocaleString("ja-JP")}
        </InfoRow>
        <InfoRow label="アップロード担当者">
          {batch.uploadedBy ?? "未設定"}
        </InfoRow>
        <InfoRow label="ファイル名">{batch.sourceFileName}</InfoRow>
        <InfoRow label="件数サマリ">
          総件数: {batch.totalRows.toLocaleString()} / 新規:{" "}
          {batch.newCount.toLocaleString()} / 更新:{" "}
          {batch.updatedCount.toLocaleString()} / 欠落:{" "}
          {batch.missingCount.toLocaleString()}
        </InfoRow>
        <BoardImportDeleteButton batchId={batch.id} />
      </Paper>

      <Box
        sx={{
          gridArea: "map",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: { xs: 280, lg: 360 },
          overflow: "hidden",
        }}
      >
        <BoardImportReviewMap selectedRow={selectedRow} />
      </Box>

      <Box
        sx={{
          gridArea: "content",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flexGrow: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Box sx={{ flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
          <BoardImportReviewTable
            rows={sortedRows}
            selectedRowId={selectedRow?.id ?? null}
            onSelectRow={(row) => setSelectedRowId(row.id)}
          />
        </Box>
      </Box>
    </Box>
  );
}

interface InfoRowProps {
  label: string;
  children: React.ReactNode;
}

function InfoRow({ label, children }: InfoRowProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: "0.7rem" }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ wordBreak: "break-all", lineHeight: 1.4, fontSize: "0.85rem" }}
      >
        {children}
      </Typography>
    </Box>
  );
}
