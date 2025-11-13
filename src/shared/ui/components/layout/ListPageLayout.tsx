import { Box, Container, Link, Stack, Typography } from "@mui/material";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import NextLink from "next/link";
import type { ReactNode } from "react";

import {
  LIST_PAGE_BODY_SX,
  LIST_PAGE_CONTAINER_SX,
  LIST_PAGE_HEADER_SX,
} from "@/shared/constants/layout";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ListPageLayoutProps {
  title: string;
  total: number;
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export function ListPageLayout({
  title,
  total,
  children,
  breadcrumbs,
}: ListPageLayoutProps) {
  const resolvedBreadcrumbs = breadcrumbs ?? [
    { label: "ホーム", href: "/" },
    { label: title },
  ];

  return (
    <Container maxWidth="lg" sx={LIST_PAGE_CONTAINER_SX}>
      <Stack spacing={1.5} sx={LIST_PAGE_HEADER_SX}>
        <Breadcrumbs aria-label="breadcrumb" separator="›">
          {resolvedBreadcrumbs.map((item, index) => {
            const isLast = index === resolvedBreadcrumbs.length - 1;
            if (item.href && !isLast) {
              return (
                <Link
                  key={`${item.label}-${item.href}`}
                  component={NextLink}
                  href={item.href}
                  underline="hover"
                  color="inherit"
                >
                  {item.label}
                </Link>
              );
            }
            return (
              <Typography key={`${item.label}-${index}`} color="text.primary">
                {item.label}
              </Typography>
            );
          })}
        </Breadcrumbs>
        <Box>
          <Typography variant="h4">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            全 {total} 件
          </Typography>
        </Box>
      </Stack>
      <Box sx={LIST_PAGE_BODY_SX}>{children}</Box>
    </Container>
  );
}
