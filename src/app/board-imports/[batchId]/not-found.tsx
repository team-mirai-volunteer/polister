import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

export default function BoardImportDetailNotFound() {
  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Stack spacing={3} sx={{ width: "100%" }}>
        <Typography variant="h4" component="h1">
          インポートバッチが見つかりません
        </Typography>
        <Typography variant="body1" color="text.secondary">
          リンクが無効になっているか、該当のインポートバッチが削除された可能性があります。
        </Typography>
        <Box>
          <Button
            component={Link}
            href="/board-imports"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
          >
            インポート一覧に戻る
          </Button>
        </Box>
      </Stack>
    </Container>
  );
}
