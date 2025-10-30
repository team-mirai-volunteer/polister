import { getBoardImportBatchDetailAction } from "@/features/board-import/application/actions/getBoardImportBatchDetailAction";
import { BoardImportReviewLayout } from "@/features/board-import/ui/components/BoardImportReviewLayout";
import { isBoardImportFeatureEnabled } from "@/shared/constants/featureFlags";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  LIST_PAGE_BODY_SX,
  LIST_PAGE_CONTAINER_SX,
  LIST_PAGE_HEADER_SX,
} from "@/shared/constants/layout";

interface BoardImportDetailPageProps {
  params: {
    batchId: string;
  };
}

export default async function BoardImportDetailPage({
  params,
}: BoardImportDetailPageProps) {
  if (!isBoardImportFeatureEnabled()) {
    notFound();
  }

  try {
    const { batch, rows } = await getBoardImportBatchDetailAction({
      batchId: params.batchId,
    });

    return (
      <Container
        maxWidth={false}
        sx={{
          ...LIST_PAGE_CONTAINER_SX,
          pt: 1,
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={LIST_PAGE_HEADER_SX}
        >
          <Button
            component={Link}
            href="/board-imports"
            startIcon={<ArrowBackIcon />}
            size="small"
          >
            インポート一覧に戻る
          </Button>

          <Typography variant="h6">インポートバッチ詳細</Typography>
        </Stack>

        <Box sx={LIST_PAGE_BODY_SX}>
          <BoardImportReviewLayout batch={batch} rows={rows} />
        </Box>
      </Container>
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("インポートバッチが見つかりません")
    ) {
      notFound();
    }

    console.error(
      `[BoardImportDetailPage] Failed to load batch ${params.batchId}:`,
      error
    );
    throw error;
  }
}
