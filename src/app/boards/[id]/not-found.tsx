import { Box, Container, Typography } from "@mui/material";
import Link from "next/link";

export default function BoardNotFound() {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          掲示板が見つかりません
        </Typography>
        <Typography variant="body1" color="text.secondary">
          指定された掲示板は存在しないか、削除された可能性があります。
        </Typography>
        <Link href="/" style={{ marginTop: "1rem" }}>
          トップページに戻る
        </Link>
      </Box>
    </Container>
  );
}
