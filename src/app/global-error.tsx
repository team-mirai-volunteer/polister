"use client";

import { Box, Button, Container, Paper, Typography } from "@mui/material";

import { useEffect } from "react";

import { createErrorResponseBody } from "@/shared/http/response";
import { logError } from "@/shared/logging/logger";

type GlobalErrorProps = {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    logError(error, { scope: "global-error-boundary", digest: error.digest });
  }, [error]);

  const { error: errorPayload } = createErrorResponseBody(error);

  return (
    <Box
      component="main"
      sx={{ bgcolor: "background.default", minHeight: "100vh" }}
    >
      <Container maxWidth="sm" sx={{ py: 12 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h4" component="h1" gutterBottom>
            予期しないエラーが発生しました
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            {errorPayload.message}
          </Typography>
          <Typography
            variant="caption"
            color="text.disabled"
            display="block"
            sx={{ mt: 3 }}
          >
            エラーコード: {errorPayload.code}
          </Typography>
          <Button variant="contained" sx={{ mt: 4 }} onClick={reset}>
            リトライ
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
