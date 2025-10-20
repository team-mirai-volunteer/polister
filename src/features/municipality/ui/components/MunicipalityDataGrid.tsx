/**
 * 自治体一覧DataGridコンポーネント（Client Component）
 *
 * MUI DataGridを使用した一覧表示
 */

"use client";

import {
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/features/municipality/constants";
import {
  MUNICIPALITY_FIELD_OPERATORS,
  MUNICIPALITY_FILTER_FIELDS,
  MUNICIPALITY_NO_VALUE_OPERATORS,
  type MunicipalityFilter,
  type MunicipalityFilterOperator,
} from "@/features/municipality/domain/repositories/IMunicipalityRepository";
import { Chip, Link } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridFilterModel,
  type GridPaginationModel,
  type GridRowParams,
  type GridSortModel,
} from "@mui/x-data-grid";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  sortField?: string;
  sortOrder?: "asc" | "desc";
  filterField?: string;
  filterOperator?: string;
  filterValue?: string;
}

const sanitizeField = (
  value: string | undefined
): MunicipalityFilter["field"] | undefined =>
  value &&
  MUNICIPALITY_FILTER_FIELDS.includes(value as MunicipalityFilter["field"])
    ? (value as MunicipalityFilter["field"])
    : undefined;

const defaultOperatorFor = (
  field: MunicipalityFilter["field"]
): MunicipalityFilterOperator => MUNICIPALITY_FIELD_OPERATORS[field][0];

const sanitizeOperator = (
  field: MunicipalityFilter["field"],
  operator: string | undefined
): MunicipalityFilterOperator =>
  operator &&
  MUNICIPALITY_FIELD_OPERATORS[field].includes(
    operator as MunicipalityFilterOperator
  )
    ? (operator as MunicipalityFilterOperator)
    : defaultOperatorFor(field);

const STATUS_OPERATORS = ["equals", "="] as const;

type PendingFilter = {
  field: MunicipalityFilter["field"];
  operator: MunicipalityFilterOperator;
  value: string;
};

const NO_VALUE_OPERATORS = MUNICIPALITY_NO_VALUE_OPERATORS;

export function MunicipalityDataGrid({
  municipalities,
  total,
  page,
  pageSize,
  sortField,
  sortOrder,
  filterField,
  filterOperator,
  filterValue,
}: MunicipalityDataGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createPendingFilter = useCallback(
    (
      field?: string,
      operator?: string,
      value?: string | null
    ): PendingFilter | null => {
      const sanitizedField = sanitizeField(field);

      if (!sanitizedField) {
        return null;
      }

      return {
        field: sanitizedField,
        operator: sanitizeOperator(sanitizedField, operator),
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
      renderCell: (params) => {
        const code = params.row.code as string;
        const prefectureCode = typeof code === "string" ? code.slice(0, 2) : "";

        return (
          <Link
            component={NextLink}
            href={`/prefectures/${prefectureCode}`}
            underline="hover"
            onClick={(event) => event.stopPropagation()}
          >
            {params.value}
          </Link>
        );
      },
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
      type: "number",
      valueFormatter: (params) => {
        const value = (params as { value?: number | null })?.value;
        return value !== null && value !== undefined
          ? Number(value).toLocaleString()
          : "-";
      },
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
    const params = new URLSearchParams(searchParams?.toString() ?? "");

    const newPage = model.page + 1;
    if (newPage === 1) {
      params.delete("page");
    } else {
      params.set("page", newPage.toString());
    }

    if (model.pageSize !== 50) {
      params.set("limit", model.pageSize.toString());
    } else {
      params.delete("limit");
    }

    const query = params.toString();
    router.push(`/municipalities${query ? `?${query}` : ""}`);
  };

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
      return `/municipalities${query ? `?${query}` : ""}`;
    },
    [searchParams]
  );

  const handleSortModelChange = (model: GridSortModel) => {
    const sort = model[0];

    if (!sort || !sort.sort) {
      router.push(
        buildUrl(
          {
            sortField: null,
            sortOrder: null,
          },
          false
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
        false
      )
    );
  };

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

      const operator = sanitizeOperator(filter.field, filter.operator);
      const trimmedValue = filter.value?.trim() ?? "";
      const requiresValue = !NO_VALUE_OPERATORS.has(operator);

      if (!requiresValue || trimmedValue.length > 0) {
        setPendingFilter({
          field: filter.field,
          operator,
          value: trimmedValue,
        });
        router.push(
          buildUrl(
            {
              filterField: filter.field,
              filterOperator: operator,
              filterValue: requiresValue ? trimmedValue : null,
            },
            true
          )
        );
        return;
      }

      setPendingFilter({
        field: filter.field,
        operator,
        value: "",
      });
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

    const field = sanitizeField(item.field);

    if (!field) {
      setPendingFilter(null);
      return;
    }

    const operator = sanitizeOperator(field, item.operator);

    const nextFilter: PendingFilter = {
      field,
      operator,
      value:
        item.value !== undefined && item.value !== null
          ? String(item.value)
          : "",
    };

    if (
      item.field === "status" &&
      nextFilter.operator &&
      !STATUS_OPERATORS.includes(
        nextFilter.operator as (typeof STATUS_OPERATORS)[number]
      )
    ) {
      nextFilter.operator = "equals";
    }

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
    const field = sanitizeField(sortField);

    if (!field || !sortOrder) {
      return [];
    }

    return [
      {
        field,
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

    const operator =
      resolvedFilter.field === "status"
        ? STATUS_OPERATORS.includes(
            resolvedFilter.operator as (typeof STATUS_OPERATORS)[number]
          )
          ? resolvedFilter.operator
          : "equals"
        : resolvedFilter.operator;

    return {
      items: [
        {
          id: 1,
          field: resolvedFilter.field,
          operator,
          value: resolvedFilter.value,
        },
      ],
    };
  }, [resolvedFilter]);

  const handleRowClick = (params: GridRowParams) => {
    router.push(`/municipalities/${params.row.id}`);
  };

  return (
    <DataGrid
      rows={municipalities}
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
