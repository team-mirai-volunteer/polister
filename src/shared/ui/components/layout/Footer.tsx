"use client";

import { Box, Link as MuiLink, Stack, Typography } from "@mui/material";
import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        mt: 4,
        pt: 3,
        pb: 2,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Typography variant="body2" color="text.secondary">
          © {year} Team Mirai Volunteer. All rights reserved.
        </Typography>
        <Box component="nav" aria-label="フッターナビゲーション">
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <MuiLink
              component={Link}
              href="https://team-mirai-volunteer.github.io/polister/"
              underline="hover"
              color="inherit"
              target="_blank"
              rel="noopener noreferrer"
            >
              ドキュメント
            </MuiLink>
            <MuiLink
              component={Link}
              href="https://github.com/team-mirai-volunteer/polister"
              underline="hover"
              color="inherit"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </MuiLink>
            <MuiLink
              component={Link}
              href="/municipalities"
              underline="hover"
              color="inherit"
            >
              自治体一覧
            </MuiLink>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
