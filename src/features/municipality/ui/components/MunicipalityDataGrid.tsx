/**
 * 自治体一覧DataGridコンポーネント（Client Component）
 *
 * MUI DataGridを使用した一覧表示
 */

"use client";

import { Chip } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridRowParams,
} from "@mui/x-data-grid";
import { useRouter, useSearchParams } from "next/navigation";

interface MunicipalityDTO {
  id: string;
  name: string;
  code: string;
  prefecture: string;
  status: string;
  boardCount: number | null;
  fullName: string;
  isDataCollected: boolean;
}

interface MunicipalityDataGridProps {
  municipalities: MunicipalityDTO[];
  total: number;
  page: number;
  pageSize: number;
}

// ステータスの日本語ラベル
const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "未着手",
  IN_PROGRESS: "作業中",
  CONTACTING: "問い合わせ中",
  DIGITIZING: "デジタル化中",
  PDF_COMPLETED: "PDF完了",
  CSV_COMPLETED: "CSV完了",
  COMPLETED: "完了",
  QUALITY_CHECK: "品質確認中",
  URL_FOUND: "URL発見",
  OTHER: "その他",
  OUT_OF_SCOPE: "対象外",
};

// ステータスの色
const STATUS_COLORS: Record<
  string,
  "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"
> = {
  NOT_STARTED: "default",
  IN_PROGRESS: "info",
  CONTACTING: "info",
  DIGITIZING: "info",
  PDF_COMPLETED: "primary",
  CSV_COMPLETED: "primary",
  COMPLETED: "success",
  QUALITY_CHECK: "warning",
  URL_FOUND: "info",
  OTHER: "default",
  OUT_OF_SCOPE: "error",
};

export function MunicipalityDataGrid({
  municipalities,
  total,
  page,
  pageSize,
}: MunicipalityDataGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const columns: GridColDef[] = [
    {
      field: "code",
      headerName: "コード",
      width: 100,
    },
    {
      field: "prefecture",
      headerName: "都道府県",
      width: 120,
    },
    {
      field: "name",
      headerName: "市区町村名",
      width: 200,
      flex: 1,
    },
    {
      field: "boardCount",
      headerName: "掲示板数",
      width: 120,
      align: "right",
      headerAlign: "right",
      valueFormatter: (value: number | null) =>
        value !== null && value !== undefined ? value.toLocaleString() : "-",
    },
    {
      field: "status",
      headerName: "ステータス",
      width: 150,
      renderCell: (params) => (
        <Chip
          label={STATUS_LABELS[params.value] || params.value}
          color={STATUS_COLORS[params.value] || "default"}
          size="small"
        />
      ),
    },
  ];

  const handlePaginationModelChange = (model: GridPaginationModel) => {
    // 既存のクエリパラメータを保持
    const params = new URLSearchParams(searchParams.toString());

    // ページ番号を更新（0-basedから1-basedに変換）
    const newPage = model.page + 1;
    if (newPage === 1) {
      params.delete("page");
    } else {
      params.set("page", newPage.toString());
    }

    // ページサイズを更新
    if (model.pageSize !== 50) {
      params.set("limit", model.pageSize.toString());
    } else {
      params.delete("limit");
    }

    // URLを更新
    const query = params.toString();
    router.push(`/municipalities${query ? `?${query}` : ""}`);
  };

  const handleRowClick = (params: GridRowParams) => {
    router.push(`/municipalities/${params.row.id}`);
  };

  return (
    <DataGrid
      rows={municipalities}
      columns={columns}
      rowCount={total}
      paginationMode="server"
      paginationModel={{
        page: page - 1, // 1-basedから0-basedに変換
        pageSize,
      }}
      onPaginationModelChange={handlePaginationModelChange}
      onRowClick={handleRowClick}
      pageSizeOptions={[10, 25, 50, 100]}
      disableRowSelectionOnClick
      sx={{
        "& .MuiDataGrid-row": {
          cursor: "pointer",
        },
      }}
    />
  );
}
