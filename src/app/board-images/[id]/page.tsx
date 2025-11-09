import { getBoardCandidatesAction } from "@/features/board-image/application/actions/getBoardCandidatesAction";
import { getBoardImageByIdAction } from "@/features/board-image/application/actions/getBoardImageByIdAction";
import { BoardCandidateListWrapper } from "@/features/board-image/ui/components/BoardCandidateListWrapper";
import { BoardImageActions } from "@/features/board-image/ui/components/BoardImageActions";
import { BoardImageMap } from "@/features/board-image/ui/components/BoardImageMap";
import { BoardImageViewer } from "@/features/board-image/ui/components/BoardImageViewer";
import { LinkedBoardInfo } from "@/features/board-image/ui/components/LinkedBoardInfo";
import {
  Box,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { notFound } from "next/navigation";

export const metadata = {
  title: "掲示板写真詳細 - Polister",
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BoardImageDetailPage({ params }: PageProps) {
  const { id } = await params;

  // First check if image exists
  const image = await getBoardImageByIdAction(id);
  if (!image) {
    notFound();
  }

  // Then fetch candidates
  const candidates = await getBoardCandidatesAction(id);

  const getStatusColor = (
    status: string
  ): "default" | "success" | "error" | "warning" | "info" => {
    switch (status) {
      case "VERIFIED":
        return "success";
      case "REJECTED":
        return "error";
      case "LOCATION_ISSUE":
        return "warning";
      case "DUPLICATE":
        return "default";
      case "NO_NUMBER":
        return "info";
      case "DOWNLOAD_FAILED":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "PENDING":
        return "未検証";
      case "VERIFIED":
        return "検証済み";
      case "REJECTED":
        return "却下";
      case "LOCATION_ISSUE":
        return "位置情報に問題";
      case "DUPLICATE":
        return "重複";
      case "NO_NUMBER":
        return "番号なし";
      case "DOWNLOAD_FAILED":
        return "ダウンロード失敗";
      default:
        return status;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Card 1: 写真と詳細情報 */}
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* 左: タイトル、ステータス、詳細情報 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={2}>
                {/* タイトル */}
                <Box>
                  <Typography variant="h5" component="h1" gutterBottom>
                    {image.originalFilename}
                  </Typography>
                </Box>

                {/* ステータス情報 */}
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <Chip
                    label={getStatusLabel(image.verificationStatus)}
                    color={getStatusColor(image.verificationStatus)}
                    size="small"
                  />
                  {image.boardId ? (
                    <Chip label="紐付け済み" color="success" size="small" />
                  ) : (
                    <Chip label="未紐付け" color="default" size="small" />
                  )}
                </Stack>

                {/* 詳細情報 */}
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {image.csvPrefecture && image.csvCity && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        都道府県・市区町村
                      </Typography>
                      <Typography variant="body1">
                        {image.csvPrefecture} {image.csvCity}
                      </Typography>
                    </Box>
                  )}

                  {image.csvBoardNumber && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        掲示板番号
                      </Typography>
                      <Typography variant="body1">
                        {image.csvBoardNumber}
                      </Typography>
                    </Box>
                  )}

                  {image.statusNote && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        ステータスノート
                      </Typography>
                      <Typography variant="body1">
                        {image.statusNote}
                      </Typography>
                    </Box>
                  )}

                  {image.reviewNote && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        レビューノート
                      </Typography>
                      <Typography variant="body1">
                        {image.reviewNote}
                      </Typography>
                    </Box>
                  )}

                  {image.latitude && image.longitude && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        位置情報
                      </Typography>
                      <Typography variant="body1">
                        緯度: {image.latitude.toFixed(7)}, 経度:{" "}
                        {image.longitude.toFixed(7)}
                      </Typography>
                    </Box>
                  )}

                  {image.takenAt && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        撮影日時
                      </Typography>
                      <Typography variant="body1">
                        {new Date(image.takenAt).toLocaleString("ja-JP")}
                      </Typography>
                    </Box>
                  )}

                  {/* アクションエリア */}
                  {!image.boardId && (
                    <Box
                      sx={{
                        mt: 3,
                        pt: 3,
                        borderTop: 1,
                        borderColor: "divider",
                      }}
                    >
                      <BoardImageActions
                        imageId={id}
                        currentBoardNumber={image.csvBoardNumber}
                      />
                    </Box>
                  )}
                </Stack>
              </Stack>
            </Grid>

            {/* 右: 画像（高さ制限） */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ maxHeight: 500, overflow: "hidden" }}>
                <BoardImageViewer image={image} />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Card 2: 地図と候補掲示板 or 紐付け情報 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" mb={2}>
            {image.boardId ? "紐付け済み掲示板" : "候補掲示板マッチング"}
          </Typography>

          <Grid container spacing={3}>
            {/* 地図（常時表示） */}
            <Grid size={{ xs: 12, md: 6 }}>
              <BoardImageMap
                latitude={image.latitude}
                longitude={image.longitude}
                candidates={image.boardId ? [] : candidates}
              />
            </Grid>

            {/* 候補リスト or 紐付け情報 */}
            <Grid size={{ xs: 12, md: 6 }}>
              {image.boardId ? (
                <LinkedBoardInfo
                  imageId={id}
                  boardId={image.boardId}
                  boardNumber={image.csvBoardNumber}
                  isPublic={image.isPublic}
                />
              ) : candidates.length > 0 ? (
                <Box sx={{ maxHeight: 600, overflow: "auto" }}>
                  <BoardCandidateListWrapper
                    candidates={candidates}
                    imageId={id}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 400,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    候補掲示板が見つかりませんでした
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Stack>
    </Container>
  );
}
