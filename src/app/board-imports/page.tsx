import { listBoardImportBatchesAction } from "@/features/board-import/application/actions/listBoardImportBatchesAction";
import { BoardImportBatchList } from "@/features/board-import/ui/components/BoardImportBatchList";
import { BoardImportUploadForm } from "@/features/board-import/ui/components/BoardImportUploadForm";
import { isBoardImportFeatureEnabled } from "@/shared/constants/featureFlags";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { notFound } from "next/navigation";

const PAGE_SIZE = 25;
const ROOT_CURSOR_MARKER = "__root__";

const decodeCursorTrail = (value?: string): string[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
};

interface BoardImportsPageProps {
  searchParams?: Promise<{
    municipalityId?: string;
    municipalityName?: string;
    cursor?: string;
    cursorTrail?: string;
  }>;
}

export default async function BoardImportsPage({
  searchParams,
}: BoardImportsPageProps) {
  if (!isBoardImportFeatureEnabled()) {
    notFound();
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  const municipalityId = resolvedParams?.municipalityId;
  const municipalityName = resolvedParams?.municipalityName;
  const cursor = resolvedParams?.cursor;
  const cursorTrail = decodeCursorTrail(resolvedParams?.cursorTrail);

  const { items: batches, nextCursor } = await listBoardImportBatchesAction({
    limit: PAGE_SIZE,
    cursor,
  });

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
          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
            {cursorTrail.length > 0
              ? (() => {
                  const previousParams = new URLSearchParams();
                  if (municipalityId) {
                    previousParams.set("municipalityId", municipalityId);
                  }
                  if (municipalityName) {
                    previousParams.set("municipalityName", municipalityName);
                  }

                  const previousTrail = cursorTrail.slice(0, -1);
                  const previousCursor = cursorTrail[cursorTrail.length - 1];

                  if (previousCursor && previousCursor !== ROOT_CURSOR_MARKER) {
                    previousParams.set("cursor", previousCursor);
                  }

                  if (previousTrail.length > 0) {
                    previousParams.set(
                      "cursorTrail",
                      JSON.stringify(previousTrail)
                    );
                  }

                  const previousSearch = previousParams.toString();
                  const previousHref = previousSearch
                    ? `/board-imports?${previousSearch}`
                    : "/board-imports";

                  return (
                    <Button
                      component={Link}
                      href={previousHref}
                      variant="outlined"
                      color="primary"
                    >
                      前のページ
                    </Button>
                  );
                })()
              : null}
            {nextCursor
              ? (() => {
                  const nextParams = new URLSearchParams();
                  if (municipalityId) {
                    nextParams.set("municipalityId", municipalityId);
                  }
                  if (municipalityName) {
                    nextParams.set("municipalityName", municipalityName);
                  }
                  nextParams.set("cursor", nextCursor);

                  const nextTrail = [
                    ...cursorTrail,
                    cursor ?? ROOT_CURSOR_MARKER,
                  ];
                  if (nextTrail.length > 0) {
                    nextParams.set("cursorTrail", JSON.stringify(nextTrail));
                  }

                  const nextSearch = nextParams.toString();
                  const nextHref = nextSearch
                    ? `/board-imports?${nextSearch}`
                    : "/board-imports";

                  return (
                    <Button
                      component={Link}
                      href={nextHref}
                      variant="outlined"
                      color="primary"
                    >
                      次のページ
                    </Button>
                  );
                })()
              : null}
          </Stack>
        </div>
      </Stack>
    </Container>
  );
}
