import {
  AppBar,
  Box,
  Button,
  Container,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material";

export default function Home() {
  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Polister
          </Typography>
          <Button color="inherit">ログイン</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Polister プロジェクトへようこそ
        </Typography>

        <Typography variant="h5" color="text.secondary" paragraph>
          Next.js 15 + React 19 + TypeScript + Material UI で構築されています
        </Typography>

        <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
          <Button variant="contained" size="large">
            はじめる
          </Button>
          <Button variant="outlined" size="large">
            ドキュメント
          </Button>
        </Box>

        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            機能
          </Typography>
          <Typography variant="body1">
            • Next.js 15 with App Router
            <br />
            • React 19
            <br />
            • TypeScript
            <br />
            • Material UI
            <br />
            • Prettier with import sorting
            <br />• Docusaurus ドキュメント
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
