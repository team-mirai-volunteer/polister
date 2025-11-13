import { listBoardImportBatchesAction } from "@/features/board-import/application/actions/listBoardImportBatchesAction";
import { BoardImportBatchList } from "@/features/board-import/ui/components/BoardImportBatchList";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

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

const buildPreviousPageHref = (params: {
  cursorTrail: string[];
  municipalityId?: string;
  municipalityName?: string;
}): string | null => {
  if (params.cursorTrail.length === 0) {
    return null;
  }

  const previousParams = new URLSearchParams();
  if (params.municipalityId) {
    previousParams.set("municipalityId", params.municipalityId);
  }
  if (params.municipalityName) {
    previousParams.set("municipalityName", params.municipalityName);
  }

  const previousTrail = params.cursorTrail.slice(0, -1);
  const previousCursor = params.cursorTrail[params.cursorTrail.length - 1];

  if (previousCursor && previousCursor !== ROOT_CURSOR_MARKER) {
    previousParams.set("cursor", previousCursor);
  }

  if (previousTrail.length > 0) {
    previousParams.set("cursorTrail", JSON.stringify(previousTrail));
  }

  const previousSearch = previousParams.toString();
  return previousSearch ? `/board-imports?${previousSearch}` : "/board-imports";
};

const buildNextPageHref = (params: {
  cursorTrail: string[];
  currentCursor?: string;
  nextCursor: string;
  municipalityId?: string;
  municipalityName?: string;
}): string => {
  const nextParams = new URLSearchParams();
  if (params.municipalityId) {
    nextParams.set("municipalityId", params.municipalityId);
  }
  if (params.municipalityName) {
    nextParams.set("municipalityName", params.municipalityName);
  }
  nextParams.set("cursor", params.nextCursor);

  const nextTrail = [
    ...params.cursorTrail,
    params.currentCursor ?? ROOT_CURSOR_MARKER,
  ];
  if (nextTrail.length > 0) {
    nextParams.set("cursorTrail", JSON.stringify(nextTrail));
  }

  const nextSearch = nextParams.toString();
  return nextSearch ? `/board-imports?${nextSearch}` : "/board-imports";
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
  const resolvedParams = searchParams ? await searchParams : undefined;
  const municipalityId = resolvedParams?.municipalityId;
  const normalizedMunicipalityId = municipalityId?.trim() ?? undefined;
  const municipalityName = resolvedParams?.municipalityName;
  const cursor = resolvedParams?.cursor;
  const cursorTrail = decodeCursorTrail(resolvedParams?.cursorTrail);

  const { items: batches, nextCursor } = await listBoardImportBatchesAction({
    municipalityId: normalizedMunicipalityId,
    limit: PAGE_SIZE,
    cursor,
  });

  const previousHref = buildPreviousPageHref({
    cursorTrail,
    municipalityId: normalizedMunicipalityId,
    municipalityName,
  });
  const nextHref = nextCursor
    ? buildNextPageHref({
        cursorTrail,
        currentCursor: cursor,
        nextCursor,
        municipalityId: normalizedMunicipalityId,
        municipalityName,
      })
    : null;

  const uploadHref = (() => {
    const params = new URLSearchParams();
    if (normalizedMunicipalityId) {
      params.set("municipalityId", normalizedMunicipalityId);
    }
    if (municipalityName) {
      params.set("municipalityName", municipalityName);
    }
    const search = params.toString();
    return search ? `/board-imports/upload?${search}` : "/board-imports/upload";
  })();

  return (
    <Container maxWidth={false} sx={{ py: 4 }}>
      <Stack spacing={4}>
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
            <Typography color="text.primary">インポート一覧</Typography>
          </Breadcrumbs>
          <div>
            <Typography variant="h4" gutterBottom>
              掲示場CSVインポート
            </Typography>
            <Typography variant="body1" color="text.secondary">
              自治体ごとの掲示場CSVを取り込み、既存データとの比較・反映を管理します。
            </Typography>
          </div>
        </Stack>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="flex-start"
        >
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            新しいCSVを取り込む場合は「CSVインポート」ページに移動してください。各バッチの比較・反映状況は下記の履歴から確認できます。
          </Typography>
          <Button component={NextLink} href={uploadHref} variant="contained">
            CSVインポートを行う
          </Button>
        </Stack>

        <Divider />

        <div>
          <Typography variant="h6" gutterBottom>
            インポート履歴
          </Typography>
          <BoardImportBatchList batches={batches} />
          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
            {previousHref ? (
              <Button
                component={NextLink}
                href={previousHref}
                variant="outlined"
                color="primary"
              >
                前のページ
              </Button>
            ) : null}
            {nextHref ? (
              <Button
                component={NextLink}
                href={nextHref}
                variant="outlined"
                color="primary"
              >
                次のページ
              </Button>
            ) : null}
          </Stack>
        </div>
      </Stack>
    </Container>
  );
}
