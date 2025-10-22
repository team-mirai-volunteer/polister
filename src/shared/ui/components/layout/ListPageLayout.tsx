import { Box, Container, Typography } from "@mui/material";
import type { ReactNode } from "react";

import {
  LIST_PAGE_BODY_SX,
  LIST_PAGE_CONTAINER_SX,
  LIST_PAGE_HEADER_SX,
} from "@/shared/constants/layout";

interface ListPageLayoutProps {
  title: string;
  total: number;
  children: ReactNode;
}

export function ListPageLayout({
  title,
  total,
  children,
}: ListPageLayoutProps) {
  return (
    <Container maxWidth="lg" sx={LIST_PAGE_CONTAINER_SX}>
      <Box sx={LIST_PAGE_HEADER_SX}>
        <Typography variant="h4">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          全 {total} 件
        </Typography>
      </Box>
      <Box sx={LIST_PAGE_BODY_SX}>{children}</Box>
    </Container>
  );
}
