"use client";

import { Box, Button, Grid, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { Suspense } from "react";

import MapboxMap from "@/components/map/MapboxMap";

const formatNumber = (value: number) => value.toLocaleString("ja-JP");

const MapFallback = () => (
  <Box
    sx={{
      width: "100%",
      minHeight: 320,
      borderRadius: 5,
      bgcolor: "rgba(69, 85, 108, 0.08)",
    }}
  />
);

export interface HomePageContentProps {
  metrics: {
    municipalities: number;
    boards: number;
  };
}

export function HomePageContent({ metrics }: HomePageContentProps) {
  const summary = [
    {
      label: "自治体データ",
      value: `${formatNumber(metrics.municipalities)} 件`,
      description: "掲示板情報を管理する市区町村のマスターデータ",
    },
    {
      label: "掲示板候補",
      value: `${formatNumber(metrics.boards)} 件`,
      description: "自治体公開資料から収集した掲示板候補レコード",
    },
  ];

  return (
    <Stack spacing={{ xs: 6, md: 8 }} sx={{ py: { xs: 6, md: 8 } }}>
      <Stack spacing={3.5}>
        <Typography component="h1" variant="h1">
          掲示板データ運用を直感的に可視化するトップページ
        </Typography>
        <Typography variant="body1">
          PolisterのUIを掲示板管理チーム向けにリデザインしました。柔らかなトーンと落ち着いたレイアウトで、掲示板ロケーションや自治体情報をスムーズに確認できます。
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
          <Button
            component={Link}
            href="/municipalities"
            variant="contained"
            size="large"
          >
            自治体データを見る
          </Button>
          <Button
            component={Link}
            href="/prefectures"
            variant="outlined"
            size="large"
          >
            都道府県データを見る
          </Button>
          <Button
            component={Link}
            href="https://team-mirai-volunteer.github.io/polister/"
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            size="large"
          >
            開発ガイドを確認
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={{ xs: 3, md: 4 }}>
        {summary.map((metric) => (
          <Grid key={metric.label} size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper variant="outlined">
              <Stack spacing={1.5}>
                <Typography variant="overline" color="text.secondary">
                  {metric.label}
                </Typography>
                <Typography variant="h3">{metric.value}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {metric.description}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Stack spacing={2}>
        <Typography variant="h4" component="h2">
          ポスター掲示板向け地図ビュー
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Mapbox GL JS
          を利用し、衛星写真と行政境界を重ね合わせたインタラクティブな地図体験を提供します。掲示板ロケーションの確認を落ち着いたトーンで支援します。
        </Typography>
        <Paper variant="outlined">
          <Suspense fallback={<MapFallback />}>
            <Box sx={{ minHeight: 320 }}>
              <MapboxMap />
            </Box>
          </Suspense>
        </Paper>
      </Stack>
    </Stack>
  );
}
