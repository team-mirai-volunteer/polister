"use client";

import { Box, Button, Chip, Link, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { updateBoardImageAction } from "../../application/actions/updateBoardImageAction";

interface LinkedBoardInfoProps {
  imageId: string;
  boardId: string;
  boardNumber: string | null;
  isPublic: boolean;
}

export function LinkedBoardInfo({
  imageId,
  boardId,
  boardNumber,
  isPublic,
}: LinkedBoardInfoProps) {
  const router = useRouter();

  const handleUnlink = async () => {
    const confirmed = confirm(
      "掲示場との紐付けを解除しますか？\n（ステータスは未検証に戻ります）"
    );
    if (!confirmed) return;

    const result = await updateBoardImageAction({
      imageId,
      action: "unlink",
    });

    if (result.success) {
      alert("紐付けを解除しました");
      router.refresh();
    } else {
      alert(`エラー: ${result.message}`);
    }
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          <Typography variant="h6">
            掲示場 {boardNumber || "番号なし"}
          </Typography>
          <Chip
            label={isPublic ? "公開" : "非公開"}
            color={isPublic ? "success" : "default"}
            size="small"
          />
        </Stack>
        <Link
          component={NextLink}
          href={`/boards/${boardId}`}
          variant="body1"
          underline="hover"
        >
          掲示場詳細を見る →
        </Link>
      </Box>

      <Button variant="outlined" color="error" onClick={handleUnlink} fullWidth>
        紐付けを解除
      </Button>
    </Stack>
  );
}
