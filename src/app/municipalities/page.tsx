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
import { Container, Typography } from "@mui/material";

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
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        自治体一覧
      </Typography>

      <Typography variant="body2" sx={{ mb: 2 }}>
        全 {data.total} 件
      </Typography>

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
    </Container>
  );
}
