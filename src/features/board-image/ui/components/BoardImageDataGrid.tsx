"use client";

import { Box, Chip, Link, Tooltip } from "@mui/material";
import {
  DataGrid,
  getGridStringOperators,
  type GridColDef,
  type GridFilterModel,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";
import type { BoardImageDTO } from "../../application/actions/getBoardImagesAction";
import type {
  BoardImageFilterField,
  BoardImageFilterOperator,
} from "../../constants/filters";
import {
  sanitizeFilterField,
  sanitizeFilterOperator,
} from "../../constants/filters";
import { buildImagePreviewUrl } from "../utils/imageUrl";
import {
  getImageStatusColor,
  getImageStatusLabel,
} from "../utils/statusHelpers";

interface BoardImageDataGridProps {
  images: BoardImageDTO[];
  total: number;
  page: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  filterField?: string;
  filterOperator?: string;
  filterValue?: string;
}

interface PendingFilter {
  field: BoardImageFilterField;
  operator: BoardImageFilterOperator;
  value: string;
}

const STRING_FILTER_OPERATORS = getGridStringOperators().filter((operator) =>
  ["contains", "startsWith", "endsWith", "equals"].includes(operator.value)
);
const EQUALS_ONLY_OPERATOR = STRING_FILTER_OPERATORS.find(
  (operator) => operator.value === "equals"
);

export function BoardImageDataGrid({
  images,
  total,
  page,
  pageSize,
  sortField,
  sortOrder,
  filterField,
  filterOperator,
  filterValue,
}: BoardImageDataGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createPendingFilter = useCallback(
    (
      field?: string,
      operator?: string,
      value?: string | null
    ): PendingFilter | null => {
      const sanitizedField = sanitizeFilterField(field);
      if (!sanitizedField) {
        return null;
      }

      return {
        field: sanitizedField,
        operator: sanitizeFilterOperator(sanitizedField, operator),
        value: value ?? "",
      } satisfies PendingFilter;
    },
    []
  );

  const [pendingFilter, setPendingFilter] = useState<PendingFilter | null>(() =>
    createPendingFilter(filterField, filterOperator, filterValue)
  );

  useEffect(() => {
    setPendingFilter(
      createPendingFilter(filterField, filterOperator, filterValue)
    );
  }, [createPendingFilter, filterField, filterOperator, filterValue]);

  const buildUrl = useCallback(
    (updates: Record<string, string | null>, resetPage = false) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      if (resetPage) {
        params.delete("page");
      }

      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      const query = params.toString();
      return `/board-images${query ? `?${query}` : ""}`;
    },
    [searchParams]
  );

  const handlePaginationModelChange = useCallback(
    (model: GridPaginationModel) => {
      const newPage = model.page + 1;
      router.push(
        buildUrl(
          {
            page: newPage === 1 ? null : newPage.toString(),
            limit:
              model.pageSize !== pageSize ? model.pageSize.toString() : null,
          },
          false
        )
      );
    },
    [buildUrl, pageSize, router]
  );

  const handleSortModelChange = useCallback(
    (model: GridSortModel) => {
      const sort = model[0];

      if (!sort || !sort.sort) {
        router.push(
          buildUrl(
            {
              sortField: null,
              sortOrder: null,
            },
            true
          )
        );
        return;
      }

      router.push(
        buildUrl(
          {
            sortField: sort.field,
            sortOrder: sort.sort,
          },
          true
        )
      );
    },
    [buildUrl, router]
  );

  const applyFilter = useCallback(
    (filter: PendingFilter | null) => {
      if (!filter) {
        setPendingFilter(null);
        router.push(
          buildUrl(
            {
              filterField: null,
              filterOperator: null,
              filterValue: null,
            },
            true
          )
        );
        return;
      }

      const trimmedValue = filter.value.trim();
      if (trimmedValue.length === 0) {
        setPendingFilter({ ...filter, value: "" });
        router.push(
          buildUrl(
            {
              filterField: null,
              filterOperator: null,
              filterValue: null,
            },
            true
          )
        );
        return;
      }

      setPendingFilter(filter);
      router.push(
        buildUrl(
          {
            filterField: filter.field,
            filterOperator: filter.operator,
            filterValue: trimmedValue,
          },
          true
        )
      );
    },
    [buildUrl, router]
  );

  const handleFilterModelChange = useCallback(
    (model: GridFilterModel) => {
      if (model.items.length === 0) {
        setPendingFilter(null);
        applyFilter(null);
        return;
      }

      const item = model.items[0];
      if (!item?.field) {
        setPendingFilter(null);
        return;
      }

      const field = sanitizeFilterField(item.field);
      if (!field) {
        setPendingFilter(null);
        return;
      }

      const operator = sanitizeFilterOperator(field, item.operator);
      const value =
        item.value !== undefined && item.value !== null
          ? String(item.value)
          : "";

      const nextFilter: PendingFilter = {
        field,
        operator,
        value,
      };

      const previous = pendingFilter;
      setPendingFilter(nextFilter);

      const trimmedValue = value.trim();
      const hasValue = trimmedValue.length > 0;

      if (!previous) {
        return;
      }

      const fieldChanged = previous.field !== nextFilter.field;
      const operatorChanged = previous.operator !== nextFilter.operator;

      if (fieldChanged || operatorChanged) {
        if (hasValue) {
          applyFilter({ ...nextFilter, value: trimmedValue });
        } else {
          applyFilter(null);
        }
      }
    },
    [applyFilter, pendingFilter]
  );

  const handleFilterKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && !event.nativeEvent.isComposing) {
        event.preventDefault();
        applyFilter(pendingFilter);
      }
    },
    [applyFilter, pendingFilter]
  );

  const resolvedFilter = useMemo(() => {
    if (pendingFilter) {
      return pendingFilter;
    }
    return createPendingFilter(filterField, filterOperator, filterValue);
  }, [
    pendingFilter,
    createPendingFilter,
    filterField,
    filterOperator,
    filterValue,
  ]);

  const filterModel = useMemo<GridFilterModel>(() => {
    if (!resolvedFilter) {
      return { items: [] };
    }

    return {
      items: [
        {
          id: 1,
          field: resolvedFilter.field,
          operator: resolvedFilter.operator,
          value: resolvedFilter.value,
        },
      ],
    };
  }, [resolvedFilter]);

  const sortModel = useMemo<GridSortModel>(() => {
    if (!sortField || !sortOrder) {
      return [];
    }

    return [
      {
        field: sortField,
        sort: sortOrder,
      },
    ];
  }, [sortField, sortOrder]);

  const THUMBNAIL_SIZE = 48;
  const THUMBNAIL_PREVIEW_SIZE = 280;

  const columns: GridColDef[] = [
    {
      field: "thumbnail",
      headerName: "写真",
      width: 72,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const url = buildImagePreviewUrl(params.row as BoardImageDTO);
        const baseContent = url ? (
          <Box
            component="img"
            src={url}
            alt={`${params.row.originalFilename}のサムネイル`}
            sx={{
              width: THUMBNAIL_SIZE,
              height: THUMBNAIL_SIZE,
              objectFit: "cover",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "grey.100",
            }}
          />
        ) : (
          <Box
            sx={{
              width: THUMBNAIL_SIZE,
              height: THUMBNAIL_SIZE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "grey.100",
              borderRadius: 1,
              border: "1px dashed",
              borderColor: "divider",
              fontSize: "0.75rem",
              color: "text.secondary",
            }}
          >
            なし
          </Box>
        );

        if (!url) {
          return baseContent;
        }

        return (
          <Tooltip
            arrow
            placement="right"
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: "common.white",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: 3,
                  p: 1,
                },
              },
            }}
            title={
              <Box
                component="img"
                src={url}
                alt={`${params.row.originalFilename}の拡大画像`}
                sx={{
                  width: THUMBNAIL_PREVIEW_SIZE,
                  height: THUMBNAIL_PREVIEW_SIZE,
                  objectFit: "contain",
                }}
              />
            }
          >
            {baseContent}
          </Tooltip>
        );
      },
    },
    {
      field: "originalFilename",
      headerName: "ファイル名",
      width: 250,
      filterOperators: STRING_FILTER_OPERATORS,
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
      filterOperators: STRING_FILTER_OPERATORS,
    },
    {
      field: "csvCity",
      headerName: "市区町村",
      width: 150,
      filterOperators: STRING_FILTER_OPERATORS,
    },
    {
      field: "csvBoardNumber",
      headerName: "掲示場番号",
      width: 120,
      filterOperators: STRING_FILTER_OPERATORS,
    },
    {
      field: "verificationStatus",
      headerName: "ステータス",
      width: 150,
      filterOperators: EQUALS_ONLY_OPERATOR
        ? [EQUALS_ONLY_OPERATOR]
        : undefined,
      renderCell: (params) => (
        <Chip
          label={getImageStatusLabel(params.value)}
          color={getImageStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: "statusNote",
      headerName: "ステータスノート",
      width: 200,
      filterable: false,
    },
    {
      field: "boardId",
      headerName: "掲示場紐付け",
      width: 120,
      filterable: false,
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
      filterable: false,
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
      filterable: false,
      valueFormatter: (params) => {
        const value = (params as { value?: Date | string | null })?.value;
        if (!value) {
          return "-";
        }
        const date = new Date(value);
        return Number.isNaN(date.getTime())
          ? "-"
          : date.toLocaleString("ja-JP");
      },
    },
  ];

  return (
    <DataGrid
      rows={images}
      columns={columns}
      rowCount={total}
      paginationMode="server"
      sortingMode="server"
      filterMode="server"
      sortModel={sortModel}
      filterModel={filterModel}
      paginationModel={{
        page: page - 1,
        pageSize,
      }}
      onPaginationModelChange={handlePaginationModelChange}
      pageSizeOptions={[25, 50, 100]}
      sortingOrder={["asc", "desc"]}
      onSortModelChange={handleSortModelChange}
      onFilterModelChange={handleFilterModelChange}
      slotProps={{
        filterPanel: {
          filterFormProps: {
            valueInputProps: {
              InputComponentProps: {
                onKeyDown: handleFilterKeyDown,
              },
            },
          },
        },
      }}
      disableRowSelectionOnClick
    />
  );
}
