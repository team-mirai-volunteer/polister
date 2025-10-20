/**
 * 都道府県一覧 DataGrid コンポーネント（Client Component）
 */

"use client";

import type { PrefectureDTO } from "@/features/prefecture/infrastructure/mappers/PrefectureMapper";
import {
  DataGrid,
  type GridColDef,
  type GridRowParams,
} from "@mui/x-data-grid";
import { useRouter } from "next/navigation";

export interface PrefectureDataGridProps {
  prefectures: PrefectureDTO[];
}

const formatCompletionRate = (rate: number): string => {
  const clamped = Math.max(0, Math.min(1, rate));
  const percentage = clamped * 100;
  return `${percentage.toFixed(1)}%`;
};

type PrefectureRow = PrefectureDTO & {
  id: string;
  completionRateText: string;
  totalBoardCountText: string;
};

export function PrefectureDataGrid({ prefectures }: PrefectureDataGridProps) {
  const router = useRouter();

  const columns: GridColDef<PrefectureRow>[] = [
    {
      field: "code",
      headerName: "コード",
      width: 100,
    },
    {
      field: "name",
      headerName: "都道府県名",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "municipalityCount",
      headerName: "自治体数",
      width: 120,
      type: "number",
    },
    {
      field: "completedMunicipalityCount",
      headerName: "完了自治体数",
      width: 140,
      type: "number",
    },
    {
      field: "completionRateText",
      headerName: "進捗率",
      width: 120,
    },
    {
      field: "totalBoardCountText",
      headerName: "掲示板数合計",
      width: 140,
    },
  ];

  const rows: PrefectureRow[] = prefectures.map((prefecture) => ({
    ...prefecture,
    id: prefecture.code,
    completionRateText: formatCompletionRate(prefecture.completionRate),
    totalBoardCountText:
      typeof prefecture.totalBoardCount === "number"
        ? prefecture.totalBoardCount.toLocaleString()
        : "-",
  }));

  const handleRowClick = (params: GridRowParams) => {
    router.push(`/prefectures/${params.row.code}`);
  };

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      autoHeight
      pageSizeOptions={[10, 25, 50]}
      initialState={{
        pagination: {
          paginationModel: {
            page: 0,
            pageSize: 25,
          },
        },
      }}
      disableRowSelectionOnClick
      onRowClick={handleRowClick}
      sx={{
        "& .MuiDataGrid-row": {
          cursor: "pointer",
        },
      }}
    />
  );
}
