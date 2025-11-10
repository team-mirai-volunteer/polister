"use client";

/**
 * 掲示板詳細表示コンポーネント
 */

import { buildImagePreviewUrl } from "@/features/board-image/ui/utils/imageUrl";
import type { GetBoardDetailResponseDTO } from "@/features/board/application/dto/BoardDetailDTO";
import {
  BOARD_STATUS_LABELS,
  TRUST_LEVEL_LABELS,
} from "@/features/municipality/constants";
import { Edit as EditIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { BoardEditDialog } from "./BoardEditDialog";
import { BoardHistoryList } from "./BoardHistoryList";
import { BoardLocationMapEditor } from "./BoardLocationMapEditor";
import { BoardRelatedImagesSection } from "./BoardRelatedImagesSection";

interface BoardDetailViewProps {
  data: GetBoardDetailResponseDTO;
}

export function BoardDetailView({ data }: BoardDetailViewProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentData, setCurrentData] =
    useState<GetBoardDetailResponseDTO>(data);

  const handleEditSuccess = (updatedData: GetBoardDetailResponseDTO) => {
    setCurrentData(updatedData);
    setEditDialogOpen(false);
  };

  const { board, images } = currentData;

  const relatedImageMarkers = images
    .map((image, index) => ({
      image,
      order: index + 1,
    }))
    .filter(({ image }) => image.latitude !== null && image.longitude !== null)
    .map(({ image, order }) => ({
      id: image.id,
      latitude: image.latitude as number,
      longitude: image.longitude as number,
      label: image.originalFilename,
      previewUrl: buildImagePreviewUrl(image),
      href: `/board-images/${image.id}`,
      order,
    }));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1">
          掲示板詳細
        </Typography>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => setEditDialogOpen(true)}
        >
          編集
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          {board.latitude !== null && board.longitude !== null && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  位置情報
                </Typography>
                <BoardLocationMapEditor
                  latitude={board.latitude}
                  longitude={board.longitude}
                  readonly={true}
                  height={300}
                  relatedImages={relatedImageMarkers}
                />
              </CardContent>
            </Card>
          )}

          <BoardRelatedImagesSection images={images} />

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                基本情報
              </Typography>

              <Box sx={{ display: "grid", gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    掲示板番号
                  </Typography>
                  <Typography variant="body1">
                    {board.boardNumber || "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    名称
                  </Typography>
                  <Typography variant="body1">{board.name || "-"}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    住所
                  </Typography>
                  <Typography variant="body1">{board.address}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    位置情報
                  </Typography>
                  <Typography variant="body1">
                    {board.latitude !== null && board.longitude !== null
                      ? `緯度: ${board.latitude.toFixed(6)}, 経度: ${board.longitude.toFixed(6)}`
                      : "位置情報が設定されていません"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    信頼度
                  </Typography>
                  <Typography variant="body1">
                    {TRUST_LEVEL_LABELS[
                      board.trustLevel as keyof typeof TRUST_LEVEL_LABELS
                    ] || board.trustLevel}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ステータス
                  </Typography>
                  <Typography variant="body1">
                    {BOARD_STATUS_LABELS[
                      board.status as keyof typeof BOARD_STATUS_LABELS
                    ] || board.status}
                  </Typography>
                </Box>

                {board.note && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      備考
                    </Typography>
                    <Typography variant="body1">{board.note}</Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    作成日時
                  </Typography>
                  <Typography variant="body1">
                    {new Date(board.createdAt).toLocaleString("ja-JP")}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    更新日時
                  </Typography>
                  <Typography variant="body1">
                    {new Date(board.updatedAt).toLocaleString("ja-JP")}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <BoardHistoryList histories={currentData.histories} />
        </Grid>
      </Grid>

      <BoardEditDialog
        open={editDialogOpen}
        board={board}
        images={images}
        onClose={() => setEditDialogOpen(false)}
        onSuccess={handleEditSuccess}
      />
    </Container>
  );
}
