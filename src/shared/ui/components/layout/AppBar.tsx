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
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppBar() {
  const pathname = usePathname();

  const navItems = [
    { label: "ホーム", path: "/" },
    { label: "自治体一覧", path: "/municipalities" },
  ];

  return (
    <MuiAppBar position="fixed">
      <Toolbar disableGutters>
        <Container
          maxWidth="lg"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontSize: "0.85rem",
                backgroundColor: "rgba(42, 166, 147, 0.12)",
                color: "secondary.main",
              }}
            >
              P
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ letterSpacing: "0.08em" }}>
                POLISTER
              </Typography>
              <Typography variant="h6" sx={{ fontSize: "1rem" }}>
                ポスター掲示板データ基盤
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Button
                  key={item.path}
                  component={Link}
                  href={item.path}
                  variant={isActive ? "contained" : "text"}
                  color={isActive ? "secondary" : "inherit"}
                  sx={{ fontWeight: 600 }}
                >
                  {item.label}
                </Button>
              );
            })}
            <Button
              component={Link}
              href="https://team-mirai-volunteer.github.io/polister/"
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
