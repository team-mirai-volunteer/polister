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

import { APP_BAR_HEIGHT } from "@/shared/constants/layout";

import { ColorModeToggle } from "./ColorModeToggle";
import { UserMenu } from "./UserMenu";

const NAV_ITEMS = [
  { label: "ホーム", path: "/" },
  { label: "自治体一覧", path: "/municipalities" },
  { label: "都道府県一覧", path: "/prefectures" },
];

const DEFAULT_USER = {
  name: "運営チーム",
  email: "team@polister.local",
};

export function AppBar() {
  const pathname = usePathname();

  const docsUrl =
    process.env.NEXT_PUBLIC_DOCS_URL ??
    "https://team-mirai-volunteer.github.io/polister/";

  return (
    <MuiAppBar position="fixed">
      <Toolbar
        disableGutters
        sx={{
          minHeight: { xs: APP_BAR_HEIGHT.xs, md: APP_BAR_HEIGHT.md },
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
            width: "100%",
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ flex: 1, minWidth: 0 }}
          >
            <Link
              href="/"
              aria-label="POLISTER ホーム"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Stack
                direction="row"
                spacing={1.25}
                alignItems="center"
                sx={{ cursor: "pointer" }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 1,
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: "0.8rem",
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

            <Box component="nav" aria-label="グローバルナビゲーション">
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                sx={{
                  display: "flex",
                  flexWrap: { xs: "wrap", md: "nowrap" },
                  rowGap: { xs: 0.75, md: 0 },
                  ml: { xs: 0.5, md: 0 },
                }}
              >
                {NAV_ITEMS.map((item) => {
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
                        px: { xs: 1.4, md: 1.6 },
                        py: { xs: 0.5, md: 0.75 },
                        fontSize: { xs: "0.82rem", md: "0.9rem" },
                        whiteSpace: "nowrap",
                        fontWeight: 600,
                        ...(isActive
                          ? {
                              color: (theme) => theme.palette.primary.main,
                              backgroundColor: (theme) =>
                                theme.palette.primary.contrastText,
                              "&:hover": {
                                backgroundColor: (theme) =>
                                  alpha(
                                    theme.palette.primary.contrastText,
                                    0.9
                                  ),
                              },
                            }
                          : {
                              "&:hover": {
                                backgroundColor: (theme) =>
                                  alpha(
                                    theme.palette.primary.contrastText,
                                    0.12
                                  ),
                              },
                            }),
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Stack>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexShrink: 0 }}
          >
            <Button
              component={Link}
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              size="small"
              sx={{
                display: { xs: "none", md: "inline-flex" },
                fontWeight: 600,
              }}
            >
              ドキュメント
            </Button>
            <ColorModeToggle />
            <UserMenu user={DEFAULT_USER} />
          </Stack>
        </Container>
      </Toolbar>
    </MuiAppBar>
  );
}
