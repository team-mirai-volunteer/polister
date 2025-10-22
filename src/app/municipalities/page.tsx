/**
 * 自治体一覧ページ
 *
 * Server Componentで実装
 */

import { getMunicipalitiesAction } from "@/features/municipality/application/actions/getMunicipalitiesAction";
import {
  MUNICIPALITY_FIELD_OPERATORS,
  MUNICIPALITY_FILTER_FIELDS,
  type MunicipalityFilter,
  type MunicipalityFilterOperator,
} from "@/features/municipality/domain/repositories/IMunicipalityRepository";
import { MunicipalityDataGrid } from "@/features/municipality/ui/components/MunicipalityDataGrid";
import { Box, Container, Typography } from "@mui/material";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    prefecture?: string;
    search?: string;
    status?: string;
    sortField?: string;
    sortOrder?: string;
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
  }>;
}

export default async function MunicipalitiesPage({ searchParams }: PageProps) {
  // searchParamsを解決
  const params = await searchParams;

  const page = parseInt(params.page || "1");
  const limit = parseInt(params.limit || "50");
  const prefecture = params.prefecture;
  const search = params.search;
  const status = params.status;
  const sortField = params.sortField;
  const sortOrder =
    params.sortOrder === "desc"
      ? "desc"
      : params.sortOrder === "asc"
        ? "asc"
        : undefined;
  const filterField = params.filterField;
  const filterOperator = params.filterOperator;
  const filterValue = (params.filterValue ?? "").trim();

  const toMunicipalityField = (
    value?: string
  ): MunicipalityFilter["field"] | undefined =>
    value &&
    MUNICIPALITY_FILTER_FIELDS.includes(value as MunicipalityFilter["field"])
      ? (value as MunicipalityFilter["field"])
      : undefined;

  const normalizedSortField = toMunicipalityField(sortField);
  const normalizedFilterField = toMunicipalityField(filterField);
  const normalizedFilterOperator: MunicipalityFilterOperator | undefined =
    normalizedFilterField && filterOperator
      ? MUNICIPALITY_FIELD_OPERATORS[normalizedFilterField].includes(
          filterOperator as MunicipalityFilterOperator
        )
        ? (filterOperator as MunicipalityFilterOperator)
        : undefined
      : undefined;

  // Server Actionを呼び出してデータ取得
  const data = await getMunicipalitiesAction({
    page,
    limit,
    prefecture,
    search,
    status,
    sortField,
    sortOrder,
    filterField,
    filterOperator,
    filterValue,
  });

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 3,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflow: "hidden",
        height: {
          xs: "calc(100vh - 56px)",
          md: "calc(100vh - 72px)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: { xs: "wrap", sm: "nowrap" },
          gap: 1,
        }}
      >
        <Typography variant="h4">自治体一覧</Typography>
        <Typography variant="body2" color="text.secondary">
          全 {data.total} 件
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          width: "100%",
          overflow: "hidden",
        }}
      >
        <MunicipalityDataGrid
          municipalities={data.municipalities}
          total={data.total}
          page={page}
          pageSize={limit}
          sortField={normalizedSortField}
          sortOrder={sortOrder}
          filterField={normalizedFilterField}
          filterOperator={normalizedFilterOperator}
          filterValue={filterValue}
        />
      </Box>
    </Container>
  );
}
