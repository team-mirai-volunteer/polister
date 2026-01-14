import { getBoardImagesAction } from "@/features/board-image/application/actions/getBoardImagesAction";
import { BoardImageDataGrid } from "@/features/board-image/ui/components/BoardImageDataGrid";
import {
  LIST_PAGE_BODY_SX,
  LIST_PAGE_CONTAINER_SX,
  LIST_PAGE_HEADER_SX,
} from "@/shared/constants/layout";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { Box, Button, Container, Link, Typography } from "@mui/material";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import NextLink from "next/link";

export const metadata = {
  title: "掲示場写真一覧 - Polister",
  description: "掲示場写真の一覧を表示します",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    sortField?: string;
    sortOrder?: string;
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
  }>;
}

export default async function BoardImagesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = parseInt(params.limit || "50");
  const filterField = params.filterField;
  const filterOperator = params.filterOperator;
  const filterValue = params.filterValue;
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
    filterField,
    filterOperator,
    filterValue,
    sortField,
    sortOrder,
  });

  return (
    <Container maxWidth="xl" sx={LIST_PAGE_CONTAINER_SX}>
      <Box sx={{ ...LIST_PAGE_HEADER_SX, gap: 1.5 }}>
        <Breadcrumbs aria-label="breadcrumb" separator="›">
          <Link component={NextLink} href="/" underline="hover" color="inherit">
            ホーム
          </Link>
          <Typography color="text.primary">掲示場写真一覧</Typography>
        </Breadcrumbs>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4">掲示場写真一覧</Typography>
            <Typography variant="body2" color="text.secondary">
              全 {result.total} 件
            </Typography>
          </Box>
          <Button
            component={NextLink}
            href="/board-images/upload"
            variant="contained"
            startIcon={<AddPhotoAlternateIcon />}
          >
            写真をアップロード
          </Button>
        </Box>
      </Box>
      <Box sx={LIST_PAGE_BODY_SX}>
        <BoardImageDataGrid
          images={result.images}
          total={result.total}
          page={page}
          pageSize={limit}
          sortField={sortField}
          sortOrder={sortOrder}
          filterField={filterField}
          filterOperator={filterOperator}
          filterValue={filterValue}
        />
      </Box>
    </Container>
  );
}
