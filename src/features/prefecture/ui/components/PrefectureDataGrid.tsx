/**
 * 都道府県一覧 DataGrid コンポーネント（Client Component）
 */

"use client";

import type { PrefectureDTO } from "@/features/prefecture/infrastructure/mappers/PrefectureMapper";
import {
  DataGrid,
  type GridColDef,
  type GridFilterModel,
  type GridRowParams,
  type GridSortModel,
} from "@mui/x-data-grid";
import { useRouter, useSearchParams } from "next/navigation";
import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface PrefectureDataGridProps {
  prefectures: PrefectureDTO[];
  sortField?: string;
  sortOrder?: "asc" | "desc";
  filterField?: string;
  filterOperator?: string;
  filterValue?: string;
}

const formatCompletionRate = (rate: number): string => {
  const clamped = Math.max(0, Math.min(1, rate));
  const percentage = clamped * 100;
  return `${percentage.toFixed(1)}%`;
};

type PrefectureRow = PrefectureDTO & {
  id: string;
};

const DEFAULT_FILTER_OPERATOR: Record<string, string> = {
  code: "contains",
  name: "contains",
  municipalityCount: "equals",
  completedMunicipalityCount: "equals",
  completionRate: "equals",
  totalBoardCount: "equals",
};

type PendingFilter = {
  field: string;
  operator: string;
  value: string;
};

const NO_VALUE_OPERATORS = new Set(["isEmpty", "isNotEmpty"]);

export function PrefectureDataGrid({
  prefectures,
  sortField,
  sortOrder,
  filterField,
  filterOperator,
  filterValue,
}: PrefectureDataGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createPendingFilter = useCallback(
    (
      field?: string,
      operator?: string,
      value?: string | null
    ): PendingFilter | null => {
      if (!field) {
        return null;
      }

      const fallbackOperator =
        operator ?? DEFAULT_FILTER_OPERATOR[field] ?? "contains";

      return {
        field,
        operator: fallbackOperator,
        value: value ?? "",
      };
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
      field: "completionRate",
      headerName: "進捗率",
      width: 120,
      type: "number",
      valueFormatter: (params) => {
        const value = (params as { value?: number | null })?.value;
        return typeof value === "number" ? formatCompletionRate(value) : "-";
      },
    },
    {
      field: "totalBoardCount",
      headerName: "掲示板数合計",
      width: 140,
      type: "number",
      valueFormatter: (params) => {
        const value = (params as { value?: number | null })?.value;
        return typeof value === "number" ? value.toLocaleString() : "-";
      },
    },
  ];

  const rows: PrefectureRow[] = prefectures.map((prefecture) => ({
    ...prefecture,
    id: prefecture.code,
  }));

  const handleRowClick = (params: GridRowParams) => {
    router.push(`/prefectures/${params.row.code}`);
  };

  const buildUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      const query = params.toString();
      return `/prefectures${query ? `?${query}` : ""}`;
    },
    [searchParams]
  );

  const handleSortModelChange = (model: GridSortModel) => {
    const sort = model[0];

    if (!sort || !sort.sort) {
      router.push(
        buildUrl({
          sortField: null,
          sortOrder: null,
        })
      );
      return;
    }

    router.push(
      buildUrl({
        sortField: sort.field,
        sortOrder: sort.sort,
      })
    );
  };

  const applyFilter = useCallback(
    (filter: PendingFilter | null) => {
      if (!filter) {
        setPendingFilter(null);
        router.push(
          buildUrl({
            filterField: null,
            filterOperator: null,
            filterValue: null,
          })
        );
        return;
      }

      const operator = filter.operator ?? "contains";
      const trimmedValue = filter.value?.trim() ?? "";
      const requiresValue = !NO_VALUE_OPERATORS.has(operator);

      if (!requiresValue || trimmedValue.length > 0) {
        setPendingFilter({
          field: filter.field,
          operator,
          value: trimmedValue,
        });
        router.push(
          buildUrl({
            filterField: filter.field,
            filterOperator: operator,
            filterValue: requiresValue ? trimmedValue : null,
          })
        );
        return;
      }

      setPendingFilter({
        field: filter.field,
        operator,
        value: "",
      });
      router.push(
        buildUrl({
          filterField: null,
          filterOperator: null,
          filterValue: null,
        })
      );
    },
    [buildUrl, router]
  );

  const handleFilterModelChange = (model: GridFilterModel) => {
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

    const nextFilter: PendingFilter = {
      field: item.field,
      operator:
        item.operator ?? DEFAULT_FILTER_OPERATOR[item.field] ?? "contains",
      value:
        item.value !== undefined && item.value !== null
          ? String(item.value)
          : "",
    };

    const previous = pendingFilter;

    setPendingFilter(nextFilter);

    if (NO_VALUE_OPERATORS.has(nextFilter.operator)) {
      applyFilter(nextFilter);
      return;
    }

    const trimmedValue = nextFilter.value.trim();
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
  };

  const handleFilterKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && !event.nativeEvent.isComposing) {
        event.preventDefault();
        applyFilter(pendingFilter);
      }
    },
    [applyFilter, pendingFilter]
  );

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

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      sortingMode="server"
      filterMode="server"
      sortModel={sortModel}
      filterModel={filterModel}
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
      sx={{
        "& .MuiDataGrid-row": {
          cursor: "pointer",
        },
      }}
    />
  );
}
