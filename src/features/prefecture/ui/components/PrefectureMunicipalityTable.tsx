/**
 * 都道府県に紐づく自治体テーブル（Client Component）
 */

"use client";

import {
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/features/municipality/constants";
import type { MunicipalityDTO } from "@/features/prefecture/infrastructure/mappers/PrefectureMapper";
import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

export interface PrefectureMunicipalityTableProps {
  municipalities: MunicipalityDTO[];
}

export function PrefectureMunicipalityTable({
  municipalities,
}: PrefectureMunicipalityTableProps) {
  const router = useRouter();

  const handleRowClick = (id: string) => {
    router.push(`/municipalities/${id}`);
  };

  if (municipalities.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        自治体のデータが見つかりませんでした。
      </Typography>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>コード</TableCell>
          <TableCell>市区町村名</TableCell>
          <TableCell>ステータス</TableCell>
          <TableCell align="right">掲示板数</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {municipalities.map((municipality) => {
          const status = municipality.status ?? "NOT_STARTED";
          const statusLabel = STATUS_LABELS[status] ?? status;
          const statusColor = STATUS_COLORS[status] ?? "default";

          return (
            <TableRow
              key={municipality.id}
              hover
              sx={{ cursor: "pointer" }}
              onClick={() => handleRowClick(municipality.id)}
            >
              <TableCell>{municipality.code}</TableCell>
              <TableCell>
                <NextLink
                  href={`/municipalities/${municipality.id}`}
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  {municipality.fullName ?? municipality.name}
                </NextLink>
              </TableCell>
              <TableCell>
                <Chip label={statusLabel} color={statusColor} size="small" />
              </TableCell>
              <TableCell align="right">
                {typeof municipality.boardCount === "number"
                  ? municipality.boardCount.toLocaleString()
                  : "-"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
