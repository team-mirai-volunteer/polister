import { getBoardImportBatchDetailAction } from "@/features/board-import/application/actions/getBoardImportBatchDetailAction";
import { BoardImportReviewLayout } from "@/features/board-import/ui/components/BoardImportReviewLayout";
import { getMunicipalityByIdAction } from "@/features/municipality/application/actions/getMunicipalityByIdAction";
import { getMunicipalityGeoJSONAction } from "@/features/municipality/application/actions/getMunicipalityGeoJSONAction";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
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
  const { batchId } = await params;

  try {
    const { batch, rows } = await getBoardImportBatchDetailAction({
      batchId,
    });

    const [municipality, municipalityGeoJSON] = await Promise.all([
      getMunicipalityByIdAction(batch.municipalityId),
      getMunicipalityGeoJSONAction(batch.municipalityId),
    ]);

    if (!municipality) {
      notFound();
    }

    return (
      <Container
        maxWidth={false}
        sx={{
          ...LIST_PAGE_CONTAINER_SX,
          pt: 1,
        }}
      >
        <Stack spacing={1} sx={LIST_PAGE_HEADER_SX}>
          <Breadcrumbs aria-label="breadcrumb" separator="›">
            <Link component={NextLink} href="/" underline="hover">
              ホーム
            </Link>
            <Link component={NextLink} href="/board-imports" underline="hover">
              インポート一覧
            </Link>
            <Typography color="text.primary">バッチ詳細</Typography>
          </Breadcrumbs>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              component={NextLink}
              href="/board-imports"
              startIcon={<ArrowBackIcon />}
              size="small"
            >
              インポート一覧に戻る
            </Button>
            <Typography variant="h6">インポートバッチ詳細</Typography>
          </Stack>
        </Stack>

        <Box sx={LIST_PAGE_BODY_SX}>
          <BoardImportReviewLayout
            batch={batch}
            rows={rows}
            municipality={municipality}
            municipalityGeoJSON={municipalityGeoJSON}
          />
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
      `[BoardImportDetailPage] Failed to load batch ${batchId}:`,
      error
    );
    throw error;
  }
}
