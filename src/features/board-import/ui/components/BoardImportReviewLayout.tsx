"use client";

import type {
  BoardImportBatchDTO,
  BoardImportRowDTO,
} from "@/features/board-import/application/dto/BoardImportBatchDTO";
import { compareBoardNumbers } from "@/shared/domain/board/BoardNumber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { Feature } from "geojson";
import NextLink from "next/link";
import { useMemo, useState } from "react";

import { BoardImportDeleteButton } from "./BoardImportDeleteButton";
import { BoardImportReviewMap } from "./BoardImportReviewMap";
import { BoardImportReviewTable } from "./BoardImportReviewTable";

const ACTION_ORDER: Record<BoardImportRowDTO["suggestedAction"], number> = {
  CREATE: 0,
  UPDATE: 1,
  KEEP: 2,
  SKIP: 3,
};

export interface BoardImportReviewLayoutProps {
  batch: BoardImportBatchDTO;
  rows: BoardImportRowDTO[];
  municipality: {
    id: string;
    fullName: string;
    prefecture: string;
    code: string;
    name: string;
  };
  municipalityGeoJSON?: Feature | null;
}

export function BoardImportReviewLayout({
  batch,
  rows,
  municipality,
  municipalityGeoJSON,
}: BoardImportReviewLayoutProps) {
  const cardHeight = { xs: 220, lg: 360 } as const;

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const actionDiff =
        (ACTION_ORDER[a.suggestedAction] ?? 99) -
        (ACTION_ORDER[b.suggestedAction] ?? 99);
      if (actionDiff !== 0) {
        return actionDiff;
      }
      return compareBoardNumbers(a.boardNumber, b.boardNumber);
    });
  }, [rows]);

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const selectedRow = useMemo(() => {
    if (!selectedRowId) {
      return null;
    }
    return sortedRows.find((row) => row.id === selectedRowId) ?? null;
  }, [sortedRows, selectedRowId]);

  const summary = useMemo(() => {
    let locationUpdates = 0;
    let additions = 0;

    for (const row of sortedRows) {
      if (row.suggestedAction === "CREATE") {
        additions += 1;
      }

      if (row.diff?.location) {
        locationUpdates += 1;
      }
    }

    return {
      locationUpdates,
      additions,
      deletions: batch.missingCount,
    };
  }, [batch.missingCount, sortedRows]);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "320px 1fr",
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
          p: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
          boxSizing: "border-box",
          minHeight: cardHeight.xs,
          height: { lg: cardHeight.lg },
        }}
      >
        <Typography variant="subtitle2" color="text.secondary">
          バッチ情報
        </Typography>
        <InfoRow label="対象自治体">
          <Stack spacing={0.5}>
            <Typography variant="body1">{municipality.fullName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {municipality.prefecture} / 行政コード: {municipality.code}
            </Typography>
            <Link
              component={NextLink}
              href={`/municipalities/${municipality.id}`}
              color="primary"
              underline="hover"
              variant="caption"
            >
              自治体詳細を開く
            </Link>
          </Stack>
        </InfoRow>
        <InfoRow label="バッチID">{batch.id}</InfoRow>
        <Typography variant="subtitle2" color="text.secondary">
          比較サマリー
        </Typography>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          divider={
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: "none", md: "block" } }}
            />
          }
        >
          <SummaryStat
            label="位置更新"
            value={summary.locationUpdates}
            helperText="座標または住所が変化した既存データ"
          />
          <SummaryStat
            label="新規追加"
            value={summary.additions}
            helperText="取込データのみに存在する候補"
          />
          <SummaryStat
            label="削除候補"
            value={summary.deletions}
            helperText="取込データに含まれない既存データ"
          />
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <BoardImportDeleteButton batchId={batch.id} />
      </Paper>

      <Box
        sx={{
          gridArea: "map",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: cardHeight.xs,
          height: { lg: cardHeight.lg },
          overflow: "hidden",
        }}
      >
        <BoardImportReviewMap
          selectedRow={selectedRow}
          municipalityBoundary={municipalityGeoJSON ?? undefined}
          rows={sortedRows}
        />
      </Box>

      <Box
        sx={{
          gridArea: "content",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <BoardImportReviewTable
          rows={sortedRows}
          selectedRowId={selectedRowId}
          onSelectRow={(row) =>
            setSelectedRowId((current) => (current === row.id ? null : row.id))
          }
        />
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
        component="div"
        variant="body2"
        sx={{ wordBreak: "break-all", lineHeight: 1.4, fontSize: "0.85rem" }}
      >
        {children}
      </Typography>
    </Box>
  );
}

interface SummaryStatProps {
  label: string;
  value: number;
  helperText: string;
}

function SummaryStat({ label, value, helperText }: SummaryStatProps) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Tooltip title={helperText} placement="top" arrow>
          <InfoOutlinedIcon
            fontSize="inherit"
            sx={{ fontSize: 14, color: "text.secondary" }}
          />
        </Tooltip>
      </Box>
      <Typography
        variant="h6"
        sx={{ lineHeight: 1.3, fontWeight: 600, fontSize: "1.15rem" }}
      >
        {value.toLocaleString("ja-JP")} 件
      </Typography>
    </Box>
  );
}
