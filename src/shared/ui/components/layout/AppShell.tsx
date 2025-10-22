"use client";

import { Box, useTheme } from "@mui/material";
import { usePathname } from "next/navigation";

import { APP_BAR_HEIGHT } from "@/shared/constants/layout";

import { AppBar } from "./AppBar";
import { Footer } from "./Footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const pathname = usePathname();
  const showFooter = pathname === "/";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
      }}
    >
      <AppBar />
      <Box
        sx={{
          height: {
            xs: APP_BAR_HEIGHT.xs,
            md: APP_BAR_HEIGHT.md,
          },
        }}
      />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          px: { xs: 2, md: 3, xl: 4 },
        }}
      >
        <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
        {showFooter && <Footer />}
      </Box>
    </Box>
  );
}
