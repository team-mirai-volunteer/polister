"use client";

import { createBoardImportBatchAction } from "@/features/board-import/application/actions/createBoardImportBatchAction";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";

export interface BoardImportUploadFormProps {
  defaultMunicipalityId?: string;
  defaultMunicipalityName?: string;
}

export function BoardImportUploadForm({
  defaultMunicipalityId,
  defaultMunicipalityName,
}: BoardImportUploadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [municipalityId, setMunicipalityId] = useState(
    () => defaultMunicipalityId ?? ""
  );
  const [uploaderId, setUploaderId] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selected = event.target.files?.[0] ?? null;
      setFile(selected);
    },
    []
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!municipalityId) {
        setError("自治体IDを入力してください。");
        return;
      }

      if (!file) {
        setError("取り込み対象のCSVファイルを選択してください。");
        return;
      }

      setError(null);

      startTransition(async () => {
        try {
          const trimmedUploaderId = uploaderId.trim();
          const trimmedNotes = notes.trim();
          const result = await createBoardImportBatchAction({
            municipalityId: municipalityId.trim(),
            uploaderId: trimmedUploaderId || undefined,
            file,
            notes: trimmedNotes || null,
          });

          router.push(`/board-imports/${result.batch.id}`);
        } catch (submissionError) {
          setError(
            submissionError instanceof Error
              ? submissionError.message
              : "インポート処理に失敗しました。"
          );
        }
      });
    },
    [file, municipalityId, notes, router, uploaderId]
  );

  return (
    <Box
      component="section"
      sx={{
        p: 3,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        <Typography variant="h6">CSVインポート</Typography>

        <Typography variant="body2" color="text.secondary">
          自治体の全掲示場データを含むCSVを指定し、インポートバッチを作成します。
          既存掲示場との差分は次の画面で確認・調整できます。
        </Typography>

        {defaultMunicipalityId && defaultMunicipalityName ? (
          <Alert severity="info">
            対象自治体: {defaultMunicipalityName}（ID: {defaultMunicipalityId}）
          </Alert>
        ) : null}

        {error ? <Alert severity="error">{error}</Alert> : null}

        <TextField
          label="自治体ID"
          placeholder="例: 8a1b2c3d-..."
          value={municipalityId}
          onChange={(event) => setMunicipalityId(event.target.value)}
          required
          helperText="対象自治体のID。planドキュメント等で確認できます"
        />

        <TextField
          label="アップロード担当者ID"
          placeholder="ユーザーID（任意）"
          value={uploaderId}
          onChange={(event) => setUploaderId(event.target.value)}
          helperText="任意。入力した場合はアップロード担当者として記録されます"
        />

        <TextField
          label="備考"
          multiline
          minRows={2}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="必要に応じて補足メモを入力"
        />

        <Button variant="outlined" component="label">
          CSVファイルを選択
          <input
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={handleFileChange}
          />
        </Button>

        {file ? (
          <Typography variant="body2" color="text.secondary">
            選択中: {file.name}
          </Typography>
        ) : null}

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isPending}
            startIcon={isPending ? <CircularProgress size={16} /> : null}
          >
            インポート開始
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
