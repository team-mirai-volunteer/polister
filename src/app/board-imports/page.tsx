import { listBoardImportBatchesAction } from "@/features/board-import/application/actions/listBoardImportBatchesAction";
import { BoardImportBatchList } from "@/features/board-import/ui/components/BoardImportBatchList";
import { BoardImportUploadForm } from "@/features/board-import/ui/components/BoardImportUploadForm";
import { isBoardImportFeatureEnabled } from "@/shared/constants/featureFlags";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";

interface BoardImportsPageProps {
  searchParams?: Promise<{
    municipalityId?: string;
    municipalityName?: string;
  }>;
}

export default async function BoardImportsPage({
  searchParams,
}: BoardImportsPageProps) {
  if (!isBoardImportFeatureEnabled()) {
    notFound();
  }

  const batches = await listBoardImportBatchesAction({ limit: 25 });

  const resolvedParams = searchParams ? await searchParams : undefined;
  const municipalityId = resolvedParams?.municipalityId;
  const municipalityName = resolvedParams?.municipalityName;

  return (
    <Container maxWidth={false} sx={{ py: 4 }}>
      <Stack spacing={4}>
        <div>
          <Typography variant="h4" gutterBottom>
            掲示板CSVインポート
          </Typography>
          <Typography variant="body1" color="text.secondary">
            自治体ごとの掲示板CSVを取り込み、既存データとの比較・反映を管理します。
          </Typography>
        </div>

        <BoardImportUploadForm
          defaultMunicipalityId={municipalityId}
          defaultMunicipalityName={municipalityName}
        />

        <Divider />

        <div>
          <Typography variant="h6" gutterBottom>
            インポート履歴
          </Typography>
          <BoardImportBatchList batches={batches} />
        </div>
      </Stack>
    </Container>
  );
}
