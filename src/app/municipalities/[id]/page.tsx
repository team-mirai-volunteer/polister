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
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Container,
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
  const { id } = await params;

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
  const importUrl = `/board-imports/upload?municipalityId=${encodeURIComponent(
    municipality.id
  )}&municipalityName=${encodeURIComponent(municipality.fullName)}`;

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
      <Stack spacing={3}>
        <Breadcrumbs aria-label="breadcrumb" separator="›">
          <Link component={NextLink} href="/" underline="hover">
            ホーム
          </Link>
          <Link component={NextLink} href="/municipalities" underline="hover">
            自治体一覧
          </Link>
          <Typography color="text.primary">{municipality.fullName}</Typography>
        </Breadcrumbs>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Typography variant="h4">{municipality.fullName}</Typography>
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            component={NextLink}
            href={importUrl}
          >
            インポート
          </Button>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          sx={{ alignItems: "stretch" }}
        >
          <Stack
            spacing={3}
            sx={{
              flexShrink: 0,
              width: { xs: "100%", md: "fit-content" },
              minWidth: { md: 240 },
              maxWidth: { md: 360 },
            }}
          >
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
                    掲示場数
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

          <Paper
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              flex: 1,
              minHeight: 360,
              minWidth: 0,
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              掲示場マップ / 一覧
            </Typography>

            <Box sx={{ flex: 1, minHeight: 360 }}>
              <MunicipalityBoardsSection
                boards={boards}
                geojson={geojson ?? undefined}
              />
            </Box>
          </Paper>
        </Stack>
      </Stack>
    </Container>
  );
}
