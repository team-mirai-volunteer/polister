"use client";

import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Alert, AlertTitle, Box, Button, Stack, Typography } from "@mui/material";
import { useEffect } from "react";

export default function BoardImportDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Board import detail page failed", error);
  }, [error]);

  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Stack spacing={3} sx={{ maxWidth: 480, width: "100%" }}>
        <Alert
          severity="error"
          icon={<WarningAmberIcon fontSize="inherit" />}
          sx={{ alignItems: "flex-start" }}
        >
          <AlertTitle>インポートバッチの読み込みに失敗しました</AlertTitle>
          <Typography variant="body2">
            一時的な問題が発生した可能性があります。再読み込みを行っても改善しない場合は管理者へお問い合わせください。
          </Typography>
        </Alert>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={reset}
          sx={{ alignSelf: "flex-start" }}
        >
          再読み込み
        </Button>
      </Stack>
    </Box>
  );
}

