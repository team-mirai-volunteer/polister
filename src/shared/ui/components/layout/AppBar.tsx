/**
 * アプリケーション共通AppBar（Client Component）
 */

"use client";

import {
  Box,
  Button,
  AppBar as MuiAppBar,
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
    <MuiAppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Polister
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              component={Link}
              href={item.path}
              sx={{
                backgroundColor:
                  pathname === item.path
                    ? "rgba(255, 255, 255, 0.1)"
                    : "transparent",
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
}
