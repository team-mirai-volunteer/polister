import { BoardImageUploadForm } from "@/features/board-image/ui/components/BoardImageUploadForm";
import { Container, Typography } from "@mui/material";

export const metadata = {
  title: "掲示板写真アップロード - Polister",
  description: "手持ちの掲示板写真をアップロードし、位置情報を確認できます",
};

export default function BoardImageUploadPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        掲示板写真アップロード
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        自治体を選択し、手元の写真ファイルをアップロードするとExifから位置情報を取得して表示します。
      </Typography>
      <BoardImageUploadForm />
    </Container>
  );
}
