/**
 * 自治体詳細ページ
 *
 * Server Componentで実装
 */

import { getMunicipalityBoardsAction } from "@/features/municipality/application/actions/getMunicipalityBoardsAction";
import { getMunicipalityByIdAction } from "@/features/municipality/application/actions/getMunicipalityByIdAction";
import { getMunicipalityGeoJSONAction } from "@/features/municipality/application/actions/getMunicipalityGeoJSONAction";
import {
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/features/municipality/constants";
import { MunicipalityBoardsSection } from "@/features/municipality/ui/components/MunicipalityBoardsSection";
import {
  Box,
  Chip,
  Container,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
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
  const [municipalityResult, geojsonResult, boardsResult] =
    await Promise.allSettled([
      getMunicipalityByIdAction(id),
      getMunicipalityGeoJSONAction(id),
      getMunicipalityBoardsAction(id),
    ]);

  if (municipalityResult.status === "rejected") {
    throw municipalityResult.reason;
  }

  const municipality = municipalityResult.value;

  if (!municipality) {
    notFound();
  }

  const prefectureCode = municipality.code.slice(0, 2);

  if (geojsonResult.status === "rejected") {
    throw geojsonResult.reason;
  }

  const geojson = geojsonResult.value;

  const boards = boardsResult.status === "fulfilled" ? boardsResult.value : [];

  if (boardsResult.status === "rejected") {
    console.error(
      `Failed to load boards for municipality ${id}:`,
      boardsResult.reason
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {municipality.fullName}
      </Typography>

      <Grid container spacing={3} sx={{ alignItems: "stretch" }}>
        {/* 基本情報 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3} sx={{ height: "100%" }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                基本情報
              </Typography>

              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    行政区域コード
                  </Typography>
                  <Typography variant="body1">{municipality.code}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    都道府県
                  </Typography>
                  <Link
                    component={NextLink}
                    href={`/prefectures/${prefectureCode}`}
                    underline="hover"
                    color="primary"
                  >
                    {municipality.prefecture}
                  </Link>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    市区町村名
                  </Typography>
                  <Typography variant="body1">{municipality.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    データソース
                  </Typography>
                  <Typography variant="body1">{municipality.source}</Typography>
                </Box>
              </Stack>
            </Paper>

            {/* データ収集情報 */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                データ収集状況
              </Typography>

              <Stack spacing={1.5}>
                <Box>
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

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    掲示板数
                  </Typography>
                  <Typography variant="body1">
                    {municipality.boardCount !== null
                      ? `${municipality.boardCount.toLocaleString()} 件`
                      : "未設定"}
                  </Typography>
                </Box>

                {municipality.dataVersion && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      データ版
                    </Typography>
                    <Typography variant="body1">
                      {municipality.dataVersion}
                    </Typography>
                  </Box>
                )}

                {municipality.url && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      選管URL
                    </Typography>
                    <Typography variant="body1" sx={{ wordBreak: "break-all" }}>
                      <Link
                        href={municipality.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        color="primary"
                      >
                        {municipality.url}
                      </Link>
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* 掲示板一覧 / 地図 */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            sx={{
              p: 3,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              掲示板一覧
            </Typography>

            <MunicipalityBoardsSection
              boards={boards}
              geojson={geojson ?? undefined}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
