"use client";

import type {
  BoardImportBatchDTO,
  BoardImportRowDTO,
} from "@/features/board-import/application/dto/BoardImportBatchDTO";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useMemo, useState } from "react";

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
      [...rows].sort((a, b) => {
        if (a.boardNumber === null && b.boardNumber === null) {
          return 0;
        }
        if (a.boardNumber === null) {
          return 1;
        }
        if (b.boardNumber === null) {
          return -1;
        }
        return a.boardNumber - b.boardNumber;
      }),
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
          lg: "360px 1fr",
        },
        gridTemplateRows: {
          xs: "auto auto auto",
          lg: "minmax(0, min-content) 1fr",
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
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          boxSizing: "border-box",
        }}
      >
        <Typography variant="h6">バッチ情報</Typography>
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
        {batch.downloadUrl ? (
          <Button
            component={Link}
            href={batch.downloadUrl}
            target="_blank"
            startIcon={<CloudDownloadIcon />}
            size="small"
          >
            元CSVをダウンロード
          </Button>
        ) : null}
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ wordBreak: "break-all", lineHeight: 1.6 }}
      >
        {children}
      </Typography>
    </Box>
  );
}
