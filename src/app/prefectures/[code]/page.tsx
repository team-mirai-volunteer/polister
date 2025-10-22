/**
 * 都道府県詳細ページ
 */

import {
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/features/municipality/constants";
import { getPrefectureByCodeAction } from "@/features/prefecture/application/actions/getPrefectureByCodeAction";
import { PrefectureBoardsMap } from "@/features/prefecture/ui/components/PrefectureBoardsMap";
import { PrefectureMunicipalityTable } from "@/features/prefecture/ui/components/PrefectureMunicipalityTable";
import { Box, Chip, Container, Paper, Stack, Typography } from "@mui/material";
import { notFound } from "next/navigation";

const formatCompletionRate = (rate: number): string => {
  const safe = Number.isFinite(rate) ? Math.max(0, Math.min(1, rate)) : 0;
  return `${(safe * 100).toFixed(1)}%`;
};

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function PrefectureDetailPage({ params }: PageProps) {
  const { code } = await params;

  const prefecture = await getPrefectureByCodeAction(code);

  if (!prefecture) {
    notFound();
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack spacing={3} sx={{ minHeight: 0 }}>
        <Typography variant="h4">{prefecture.name}</Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          sx={{ alignItems: "stretch", minHeight: 0 }}
        >
          <Stack
            spacing={3}
            sx={{
              flexShrink: 0,
              width: { xs: "100%", md: "clamp(260px, 28vw, 360px)" },
              flexBasis: { md: "clamp(260px, 28vw, 360px)" },
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
                    都道府県コード
                  </Typography>
                  <Typography variant="body1">{prefecture.code}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    自治体数
                  </Typography>
                  <Typography variant="body1">
                    {prefecture.municipalityCount.toLocaleString()} 件
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    完了自治体数
                  </Typography>
                  <Typography variant="body1">
                    {prefecture.completedMunicipalityCount.toLocaleString()} 件
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    進捗率
                  </Typography>
                  <Typography variant="body1">
                    {formatCompletionRate(prefecture.completionRate)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    掲示板数合計
                  </Typography>
                  <Typography variant="body1">
                    {typeof prefecture.totalBoardCount === "number"
                      ? `${prefecture.totalBoardCount.toLocaleString()} 件`
                      : "未設定"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    登録掲示板件数
                  </Typography>
                  <Typography variant="body1">
                    {prefecture.boards.length.toLocaleString()} 件
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                ステータス内訳
              </Typography>

              <Stack spacing={1.5}>
                {Object.entries(STATUS_LABELS).map(([status, label]) => {
                  const count = prefecture.statusCounts?.[status] ?? 0;

                  return (
                    <Box
                      key={status}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Chip
                        label={label}
                        color={STATUS_COLORS[status] ?? "default"}
                        size="small"
                      />
                      <Typography variant="body1">
                        {count.toLocaleString()} 件
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          </Stack>

          <Stack spacing={3} sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
            <Paper
              sx={{
                p: 3,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                flex: 1,
                minHeight: 360,
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                掲示板マップ
              </Typography>

              <Box
                sx={{
                  flex: 1,
                  minHeight: 360,
                  display: "flex",
                  alignItems: "stretch",
                }}
              >
                <PrefectureBoardsMap boards={prefecture.boards} />
              </Box>
            </Paper>

            <Paper sx={{ p: 3, flexShrink: 0 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                自治体一覧
              </Typography>

              <Box sx={{ maxHeight: 320, overflow: "auto" }}>
                <PrefectureMunicipalityTable
                  municipalities={prefecture.municipalities}
                />
              </Box>
            </Paper>
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}
