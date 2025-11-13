import { BoardImportUploadForm } from "@/features/board-import/ui/components/BoardImportUploadForm";
import { getMunicipalityByIdAction } from "@/features/municipality/application/actions/getMunicipalityByIdAction";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

export const metadata = {
  title: "掲示場CSVインポート - Polister",
  description: "掲示場CSVをアップロードし、インポートバッチを作成します。",
};

interface BoardImportUploadPageProps {
  searchParams?: Promise<{
    municipalityId?: string;
    municipalityName?: string;
  }>;
}

export default async function BoardImportUploadPage({
  searchParams,
}: BoardImportUploadPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const defaultMunicipalityId = resolvedParams?.municipalityId?.trim();
  let defaultMunicipality = null;

  if (defaultMunicipalityId) {
    try {
      defaultMunicipality = await getMunicipalityByIdAction(
        defaultMunicipalityId
      );
    } catch (error) {
      console.error(
        `[BoardImportUploadPage] Failed to load municipality ${defaultMunicipalityId}`,
        error
      );
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack spacing={1.5}>
          <Breadcrumbs aria-label="breadcrumb" separator="›">
            <Link
              component={NextLink}
              href="/"
              underline="hover"
              color="inherit"
            >
              ホーム
            </Link>
            <Link
              component={NextLink}
              href="/board-imports"
              underline="hover"
              color="inherit"
            >
              インポート一覧
            </Link>
            <Typography color="text.primary">CSVインポート</Typography>
          </Breadcrumbs>
          <div>
            <Typography variant="h4" gutterBottom>
              CSVインポート
            </Typography>
            <Typography variant="body1" color="text.secondary">
              自治体単位の掲示場CSVを登録してインポートバッチを作成します。
              アップロード後は差分確認画面で既存データとの比較・承認を行えます。
            </Typography>
          </div>
        </Stack>
        <BoardImportUploadForm defaultMunicipality={defaultMunicipality} />
      </Stack>
    </Container>
  );
}
