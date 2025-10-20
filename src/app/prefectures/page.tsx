/**
 * 都道府県一覧ページ
 */

import { getPrefecturesAction } from "@/features/prefecture/application/actions/getPrefecturesAction";
import { PrefectureDataGrid } from "@/features/prefecture/ui/components/PrefectureDataGrid";
import { Container, Typography } from "@mui/material";

export default async function PrefecturesPage() {
  try {
    const prefectures = await getPrefecturesAction();

    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          都道府県一覧
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          全 {prefectures.length} 件
        </Typography>

        <PrefectureDataGrid prefectures={prefectures} />
      </Container>
    );
  } catch (error) {
    console.error("failed to load prefectures", error);
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
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
