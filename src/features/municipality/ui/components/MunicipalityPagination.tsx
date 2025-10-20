/**
 * 自治体一覧ページネーションコンポーネント（Client Component）
 *
 * URLを更新してページ遷移を実現
 */

"use client";

import { Box, Pagination } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";

interface MunicipalityPaginationProps {
  totalPages: number;
  currentPage: number;
}

export function MunicipalityPagination({
  totalPages,
  currentPage,
}: MunicipalityPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    // 既存のクエリパラメータを保持
    const params = new URLSearchParams(searchParams.toString());

    // ページ番号を更新
    if (value === 1) {
      params.delete("page");
    } else {
      params.set("page", value.toString());
    }

    // URLを更新
    const query = params.toString();
    router.push(`/municipalities${query ? `?${query}` : ""}`);
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={handlePageChange}
        color="primary"
        showFirstButton
        showLastButton
      />
    </Box>
  );
}
