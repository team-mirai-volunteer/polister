"use client";

import ZoomInIcon from "@mui/icons-material/ZoomIn";
import { Box, Card, CardActionArea } from "@mui/material";
import { useState } from "react";
import type { BoardImageDTO } from "../../application/actions/getBoardImagesAction";
import { BoardImageZoomDialog } from "./BoardImageZoomDialog";

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

  const [open, setOpen] = useState(false);

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
    <>
      <Card>
        <CardActionArea onClick={() => setOpen(true)}>
          <Box
            component="img"
            src={imageUrl}
            alt={image.originalFilename}
            sx={{
              width: "100%",
              maxHeight: 600,
              objectFit: "contain",
              bgcolor: "grey.100",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "rgba(0,0,0,0.6)",
              color: "white",
              borderRadius: 1,
              px: 1,
              py: 0.5,
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              fontSize: "0.8rem",
            }}
          >
            <ZoomInIcon fontSize="small" />
            クリックで拡大
          </Box>
        </CardActionArea>
      </Card>
      <BoardImageZoomDialog
        imageUrl={imageUrl}
        imageName={image.originalFilename}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
