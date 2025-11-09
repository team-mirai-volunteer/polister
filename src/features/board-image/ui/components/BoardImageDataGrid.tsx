"use client";

import { Chip, Link } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { BoardImageDTO } from "../../application/actions/getBoardImagesAction";

interface BoardImageDataGridProps {
  images: BoardImageDTO[];
  total: number;
  page: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

const getStatusColor = (
  status: string
): "default" | "success" | "error" | "warning" | "info" => {
  switch (status) {
    case "VERIFIED":
      return "success";
    case "REJECTED":
      return "error";
    case "LOCATION_ISSUE":
      return "warning";
    case "DUPLICATE":
      return "default";
    case "NO_NUMBER":
      return "info";
    case "DOWNLOAD_FAILED":
      return "error";
    default:
      return "default";
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case "PENDING":
      return "未検証";
    case "VERIFIED":
      return "検証済み";
    case "REJECTED":
      return "却下";
    case "LOCATION_ISSUE":
      return "位置情報に問題";
    case "DUPLICATE":
      return "重複";
    case "NO_NUMBER":
      return "番号なし";
    case "DOWNLOAD_FAILED":
      return "ダウンロード失敗";
    default:
      return status;
  }
};

export function BoardImageDataGrid({
  images,
  total,
  page,
  pageSize,
  sortField,
  sortOrder,
}: BoardImageDataGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePaginationModelChange = useCallback(
    (model: GridPaginationModel) => {
      const newPage = model.page + 1;
      const newPageSize = model.pageSize;

      const params = new URLSearchParams(searchParams);
      params.set("page", newPage.toString());
      params.set("limit", newPageSize.toString());

      router.push(`/board-images?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSortModelChange = useCallback(
    (model: GridSortModel) => {
      const params = new URLSearchParams(searchParams);

      if (model.length > 0) {
        params.set("sortField", model[0].field);
        params.set("sortOrder", model[0].sort ?? "asc");
      } else {
        params.delete("sortField");
        params.delete("sortOrder");
      }

      // ソート変更時は1ページ目に戻る
      params.set("page", "1");

      router.push(`/board-images?${params.toString()}`);
    },
    [router, searchParams]
  );

  const columns: GridColDef[] = [
    {
      field: "originalFilename",
      headerName: "ファイル名",
      width: 250,
      renderCell: (params) => (
        <Link
          component={NextLink}
          href={`/board-images/${params.row.id}`}
          underline="hover"
        >
          {params.value}
        </Link>
      ),
    },
    {
      field: "csvPrefecture",
      headerName: "都道府県",
      width: 100,
    },
    {
      field: "csvCity",
      headerName: "市区町村",
      width: 150,
    },
    {
      field: "csvBoardNumber",
      headerName: "掲示板番号",
      width: 120,
    },
    {
      field: "verificationStatus",
      headerName: "ステータス",
      width: 150,
      renderCell: (params) => (
        <Chip
          label={getStatusLabel(params.value)}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: "statusNote",
      headerName: "ステータスノート",
      width: 200,
    },
    {
      field: "boardId",
      headerName: "掲示板紐付け",
      width: 120,
      renderCell: (params) =>
        params.value ? (
          <Chip label="紐付け済み" color="success" size="small" />
        ) : (
          <Chip label="未紐付け" color="default" size="small" />
        ),
    },
    {
      field: "latitude",
      headerName: "位置情報",
      width: 100,
      renderCell: (params) =>
        params.row.latitude && params.row.longitude ? (
          <Chip label="あり" color="success" size="small" />
        ) : (
          <Chip label="なし" color="default" size="small" />
        ),
    },
    {
      field: "takenAt",
      headerName: "撮影日時",
      width: 180,
      valueFormatter: ({ value }) =>
        value ? new Date(value).toLocaleString("ja-JP") : "-",
    },
  ];

  return (
    <DataGrid
      rows={images}
      columns={columns}
      rowCount={total}
      paginationMode="server"
      paginationModel={{
        page: page - 1,
        pageSize,
      }}
      onPaginationModelChange={handlePaginationModelChange}
      pageSizeOptions={[25, 50, 100]}
      sortingMode="server"
      sortModel={
        sortField && sortOrder ? [{ field: sortField, sort: sortOrder }] : []
      }
      onSortModelChange={handleSortModelChange}
      disableRowSelectionOnClick
    />
  );
}
