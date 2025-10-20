/**
 * 都道府県一覧ページ
 */

import { getPrefecturesAction } from "@/features/prefecture/application/actions/getPrefecturesAction";
import { PrefectureDataGrid } from "@/features/prefecture/ui/components/PrefectureDataGrid";
import { Container, Typography } from "@mui/material";

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

    const sortField = params.sortField;
    const sortOrder =
      params.sortOrder === "desc"
        ? "desc"
        : params.sortOrder === "asc"
          ? "asc"
          : undefined;
    const filterField = params.filterField;
    const filterOperator = params.filterOperator;
    const filterValue = params.filterValue ?? "";

    const prefectures = await getPrefecturesAction({
      sortField,
      sortOrder,
      filterField,
      filterOperator,
      filterValue,
    });

    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          都道府県一覧
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          全 {prefectures.length} 件
        </Typography>

        <PrefectureDataGrid
          prefectures={prefectures}
          sortField={sortField}
          sortOrder={sortOrder}
          filterField={filterField}
          filterOperator={filterOperator}
          filterValue={filterValue}
        />
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
