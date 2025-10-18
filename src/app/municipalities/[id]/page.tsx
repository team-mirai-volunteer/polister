/**
 * 自治体詳細ページ
 *
 * Server Componentで実装
 */

import { getMunicipalityByIdAction } from "@/features/municipality/application/actions/getMunicipalityByIdAction";
import { getMunicipalityGeoJSONAction } from "@/features/municipality/application/actions/getMunicipalityGeoJSONAction";
import { MunicipalityMap } from "@/features/municipality/ui/components/MunicipalityMap";
import { Box, Chip, Container, Grid, Paper, Typography } from "@mui/material";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
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

export default async function MunicipalityDetailPage({ params }: PageProps) {
  // paramsを解決
  const { id } = await params;

  // Server Actionsを並列実行
  const [municipality, geojson] = await Promise.all([
    getMunicipalityByIdAction(id),
    getMunicipalityGeoJSONAction(id),
  ]);

  if (!municipality) {
    notFound();
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {municipality.fullName}
      </Typography>

      <Grid container spacing={3}>
        {/* 基本情報 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              基本情報
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                行政区域コード
              </Typography>
              <Typography variant="body1">{municipality.code}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                都道府県
              </Typography>
              <Typography variant="body1">{municipality.prefecture}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                市区町村名
              </Typography>
              <Typography variant="body1">{municipality.name}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                データソース
              </Typography>
              <Typography variant="body1">{municipality.source}</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* データ収集情報 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              データ収集状況
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                ステータス
              </Typography>
              <Chip
                label={
                  STATUS_LABELS[municipality.status] || municipality.status
                }
                color={STATUS_COLORS[municipality.status] || "default"}
                sx={{ mt: 1 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                掲示場数
              </Typography>
              <Typography variant="body1">
                {municipality.boardCount !== null
                  ? `${municipality.boardCount.toLocaleString()} 件`
                  : "未設定"}
              </Typography>
            </Box>

            {municipality.dataVersion && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  データ版
                </Typography>
                <Typography variant="body1">
                  {municipality.dataVersion}
                </Typography>
              </Box>
            )}

            {municipality.url && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  選管URL
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    wordBreak: "break-all",
                    color: "primary.main",
                  }}
                >
                  <a
                    href={municipality.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {municipality.url}
                  </a>
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* 地図 */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              行政区域地図
            </Typography>

            {geojson ? (
              <MunicipalityMap geojson={geojson} />
            ) : (
              <Typography color="text.secondary">
                ポリゴンデータがありません
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
