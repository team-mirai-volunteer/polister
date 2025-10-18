/**
 * 自治体詳細ページ
 *
 * Server Componentで実装
 */

import { getMunicipalityByIdAction } from "@/features/municipality/application/actions/getMunicipalityByIdAction";
import { getMunicipalityGeoJSONAction } from "@/features/municipality/application/actions/getMunicipalityGeoJSONAction";
import {
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/features/municipality/constants";
import { MunicipalityMap } from "@/features/municipality/ui/components/MunicipalityMap";
import { Box, Chip, Container, Grid, Paper, Typography } from "@mui/material";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

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
