import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Typography,
} from "@mui/material";

import Link from "next/link";
import { Suspense } from "react";

import MapboxMap from "@/components/map/MapboxMap";

const MapFallback = () => (
  <Box
    sx={{
      width: "100%",
      height: { xs: 320, md: 520 },
      borderRadius: 2,
      bgcolor: "grey.100",
    }}
  />
);

export default function Home() {
  return (
    <Box>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Polisterプロジェクトへようこそ
        </Typography>

        <Typography variant="h5" color="text.secondary" paragraph>
          選挙ポスター掲示板位置管理サービス
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2, mb: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  自治体一覧
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  全国1905件の市区町村データを閲覧できます。
                  各自治体の行政区域境界を地図上で確認できます。
                </Typography>
                <Button
                  variant="contained"
                  component={Link}
                  href="/municipalities"
                  fullWidth
                >
                  自治体一覧を見る
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  ドキュメント
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  プロジェクトのアーキテクチャ、開発ガイド、要件定義などのドキュメントを参照できます。
                </Typography>
                <Button
                  variant="outlined"
                  component="a"
                  href="https://team-mirai-volunteer.github.io/polister/"
                  target="_blank"
                  rel="noopener noreferrer"
                  fullWidth
                >
                  ドキュメントを見る
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            機能
          </Typography>
          <Typography variant="body1">
            • Next.js 15 with App Router
            <br />
            • React 19
            <br />
            • TypeScript
            <br />
            • Material UI
            <br />
            • Prettier with import sorting
            <br />• Docusaurus ドキュメント
          </Typography>
        </Paper>

        <Box sx={{ mt: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            ポスター掲示板向け地図ビュー
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Mapbox GL JS
            を利用し、地図と衛星写真を切り替えながらポスター掲示板の位置確認に適したスタイルを提供します。
          </Typography>
          <Suspense fallback={<MapFallback />}>
            <MapboxMap />
          </Suspense>
        </Box>
      </Container>
    </Box>
  );
}
