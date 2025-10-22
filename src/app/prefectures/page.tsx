/**
 * 都道府県一覧ページ
 */

import { getPrefecturesAction } from "@/features/prefecture/application/actions/getPrefecturesAction";
import {
  PREFECTURE_FIELD_OPERATORS,
  PREFECTURE_FILTER_FIELDS,
  type PrefectureFilter,
  type PrefectureFilterOperator,
} from "@/features/prefecture/domain/repositories/IPrefectureRepository";
import { PrefectureDataGrid } from "@/features/prefecture/ui/components/PrefectureDataGrid";
import { Box, Container, Typography } from "@mui/material";

interface PrefecturesPageProps {
  searchParams: Promise<{
    sortField?: string;
    sortOrder?: string;
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
  }>;
}

export default async function PrefecturesPage({
  searchParams,
}: PrefecturesPageProps) {
  try {
    const params = await searchParams;

    const toPrefectureField = (
      value?: string
    ): PrefectureFilter["field"] | undefined =>
      value &&
      PREFECTURE_FILTER_FIELDS.includes(value as PrefectureFilter["field"])
        ? (value as PrefectureFilter["field"])
        : undefined;

    const normalizedSortField = toPrefectureField(params.sortField);
    const sortField = params.sortField;
    const sortOrder =
      params.sortOrder === "desc"
        ? "desc"
        : params.sortOrder === "asc"
          ? "asc"
          : undefined;
    const filterField = params.filterField;
    const normalizedFilterField = toPrefectureField(filterField);
    const filterOperator = params.filterOperator;
    const normalizedFilterOperator: PrefectureFilterOperator | undefined =
      normalizedFilterField && filterOperator
        ? PREFECTURE_FIELD_OPERATORS[normalizedFilterField].includes(
            filterOperator as PrefectureFilterOperator
          )
          ? (filterOperator as PrefectureFilterOperator)
          : undefined
        : undefined;
    const filterValue = (params.filterValue ?? "").trim();

    const prefectures = await getPrefecturesAction({
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
          <Typography variant="h4">都道府県一覧</Typography>
          <Typography variant="body2" color="text.secondary">
            全 {prefectures.length} 件
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
          <PrefectureDataGrid
            prefectures={prefectures}
            sortField={normalizedSortField}
            sortOrder={sortOrder}
            filterField={normalizedFilterField}
            filterOperator={normalizedFilterOperator}
            filterValue={filterValue}
          />
        </Box>
      </Container>
    );
  } catch (error) {
    console.error("failed to load prefectures", error);
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          都道府県一覧
        </Typography>
        <Typography color="error">
          データの取得に失敗しました。時間をおいて再度お試しください。
        </Typography>
      </Container>
    );
  }
}
