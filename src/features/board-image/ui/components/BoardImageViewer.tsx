"use client";

import { Box, Card, CardMedia } from "@mui/material";
import type { BoardImageDTO } from "../../application/actions/getBoardImagesAction";

interface BoardImageViewerProps {
  image: BoardImageDTO;
}

export function BoardImageViewer({ image }: BoardImageViewerProps) {
  // 表示用画像のURLを生成
  const imageUrl = image.displayPath
    ? `/api/images/${image.displayPath}`
    : image.thumbnailPath
      ? `/api/images/${image.thumbnailPath}`
      : null;

  if (!imageUrl) {
    return (
      <Box
        sx={{
          height: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "grey.200",
          borderRadius: 1,
        }}
      >
        画像がダウンロードされていません
      </Box>
    );
  }

  return (
    <Card>
      <CardMedia
        component="img"
        image={imageUrl}
        alt={image.originalFilename}
        sx={{
          maxHeight: 600,
          objectFit: "contain",
          bgcolor: "grey.100",
        }}
      />
    </Card>
  );
}
