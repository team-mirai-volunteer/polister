import { getBoardImagesAction } from "@/features/board-image/application/actions/getBoardImagesAction";
import { BoardImageDataGrid } from "@/features/board-image/ui/components/BoardImageDataGrid";
import {
  LIST_PAGE_BODY_SX,
  LIST_PAGE_CONTAINER_SX,
  LIST_PAGE_HEADER_SX,
} from "@/shared/constants/layout";
import { Box, Container, Typography } from "@mui/material";

export const metadata = {
  title: "掲示板写真一覧 - Polister",
  description: "掲示板写真の一覧を表示します",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    verificationStatus?: string;
    prefecture?: string;
    city?: string;
    sortField?: string;
    sortOrder?: string;
  }>;
}

export default async function BoardImagesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = parseInt(params.limit || "50");
  const verificationStatus = params.verificationStatus;
  const prefecture = params.prefecture;
  const city = params.city;
  const sortField = params.sortField;
  const sortOrder =
    params.sortOrder === "desc"
      ? "desc"
      : params.sortOrder === "asc"
        ? "asc"
        : undefined;

  const result = await getBoardImagesAction({
    limit,
    offset: (page - 1) * limit,
    verificationStatus,
    csvPrefecture: prefecture,
    csvCity: city,
    sortField,
    sortOrder,
  });

  return (
    <Container maxWidth="xl" sx={LIST_PAGE_CONTAINER_SX}>
      <Box sx={LIST_PAGE_HEADER_SX}>
        <Typography variant="h4">掲示板写真一覧</Typography>
        <Typography variant="body2" color="text.secondary">
          全 {result.total} 件
        </Typography>
      </Box>
      <Box sx={LIST_PAGE_BODY_SX}>
        <BoardImageDataGrid
          images={result.images}
          total={result.total}
          page={page}
          pageSize={limit}
          sortField={sortField as never}
          sortOrder={sortOrder}
        />
      </Box>
    </Container>
  );
}
