/**
 * アプリケーション共通AppBar（Client Component）
 */

"use client";

import {
  Box,
  Button,
  Container,
  AppBar as MuiAppBar,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppBar() {
  const pathname = usePathname();

  const navItems = [
    { label: "ホーム", path: "/" },
    { label: "自治体一覧", path: "/municipalities" },
    { label: "都道府県一覧", path: "/prefectures" },
  ];

  const docsUrl =
    process.env.NEXT_PUBLIC_DOCS_URL ??
    "https://team-mirai-volunteer.github.io/polister/";

  return (
    <MuiAppBar position="fixed">
      <Toolbar
        disableGutters
        sx={{
          minHeight: { xs: 56, md: 72 },
          px: { xs: 2, md: 0 },
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ cursor: "pointer" }}
            >
              <Box
                aria-hidden="true"
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1,
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  backgroundColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.12),
                  color: "secondary.main",
                }}
              >
                P
              </Box>
              <Typography
                variant="h6"
                component="span"
                sx={{ letterSpacing: "0.12em", fontSize: "1.1rem" }}
              >
                POLISTER
              </Typography>
            </Stack>
          </Link>

          <Stack direction="row" spacing={0.5} alignItems="center">
            {navItems.map((item) => {
              const isActive =
                item.path === "/"
                  ? pathname === "/"
                  : pathname === item.path ||
                    pathname.startsWith(`${item.path}/`);
              return (
                <Button
                  key={item.path}
                  component={Link}
                  href={item.path}
                  variant="text"
                  color="inherit"
                  aria-current={isActive ? "page" : undefined}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    ...(isActive
                      ? {
                          color: (theme) => theme.palette.primary.main,
                          backgroundColor: (theme) =>
                            theme.palette.primary.contrastText,
                          "&:hover": {
                            backgroundColor: (theme) =>
                              alpha(theme.palette.primary.contrastText, 0.9),
                          },
                        }
                      : {
                          "&:hover": {
                            backgroundColor: (theme) =>
                              alpha(theme.palette.primary.contrastText, 0.12),
                          },
                        }),
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
            <Button
              component={Link}
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            >
              ドキュメント
            </Button>
          </Stack>
        </Container>
      </Toolbar>
    </MuiAppBar>
  );
}
