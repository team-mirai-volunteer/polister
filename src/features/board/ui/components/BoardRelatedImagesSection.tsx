"use client";

import { buildImagePreviewUrl } from "@/features/board-image/ui/utils/imageUrl";
import {
  getImageStatusColor,
  getImageStatusLabel,
} from "@/features/board-image/ui/utils/statusHelpers";
import type { BoardRelatedImageDTO } from "@/features/board/application/dto/BoardDetailDTO";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

interface BoardRelatedImagesSectionProps {
  images: BoardRelatedImageDTO[];
}

export function BoardRelatedImagesSection({
  images,
}: BoardRelatedImagesSectionProps) {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          関連写真
        </Typography>

        {images.length === 0 ? (
          <Box sx={{ color: "text.secondary" }}>紐付いた写真はありません。</Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(3, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              },
            }}
          >
            {images.map((image, index) => {
              const previewUrl = buildImagePreviewUrl(image);
              const order = index + 1;
              return (
                <Box key={image.id}>
                  <Box
                    sx={{
                      borderRadius: 1,
                      overflow: "hidden",
                      position: "relative",
                      pt: "66.66%",
                      bgcolor: "grey.100",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    {previewUrl ? (
                      <Box
                        component="img"
                        src={previewUrl}
                        alt={`${image.originalFilename}のプレビュー`}
                        sx={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "text.secondary",
                          fontSize: "0.8rem",
                        }}
                      >
                        未ダウンロード
                      </Box>
                    )}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        width: 28,
                        height: 28,
                        borderRadius: "999px",
                        bgcolor: "rgba(0,0,0,0.6)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.85rem",
                        fontWeight: "bold",
                        pointerEvents: "none",
                      }}
                    >
                      {order}
                    </Box>
                  </Box>

                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    <Typography variant="body2" noWrap>
                      #{order} {image.originalFilename}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={getImageStatusLabel(image.verificationStatus)}
                        color={getImageStatusColor(image.verificationStatus)}
                        size="small"
                      />
                      {image.takenAt && (
                        <Typography variant="caption" color="text.secondary">
                          {new Date(image.takenAt).toLocaleDateString("ja-JP")}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
