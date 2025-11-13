"use client";

import { createBoardImportBatchAction } from "@/features/board-import/application/actions/createBoardImportBatchAction";
import Alert from "@mui/material/Alert";
import Autocomplete, {
  type AutocompleteChangeReason,
  type AutocompleteInputChangeReason,
} from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";

interface MunicipalityOption {
  id: string;
  name: string;
  prefecture: string;
  code: string;
}

const formatMunicipalityLabel = (option: MunicipalityOption | null) => {
  if (!option) {
    return "";
  }

  const combined = `${option.prefecture ?? ""} ${option.name ?? ""}`.trim();
  return combined || option.name || "";
};

const mapDefaultMunicipalityToOption = (
  municipality:
    | {
        id: string;
        name: string;
        prefecture: string;
        code: string;
        fullName?: string;
      }
    | null
    | undefined
): MunicipalityOption | null => {
  if (!municipality) {
    return null;
  }

  return {
    id: municipality.id,
    name: municipality.name,
    prefecture: municipality.prefecture,
    code: municipality.code,
  };
};

export interface BoardImportUploadFormProps {
  defaultMunicipality?: {
    id: string;
    name: string;
    prefecture: string;
    code: string;
    fullName?: string;
  } | null;
}

export function BoardImportUploadForm({
  defaultMunicipality,
}: BoardImportUploadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploaderId, setUploaderId] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initialMunicipality =
    mapDefaultMunicipalityToOption(defaultMunicipality);
  const [selectedMunicipality, setSelectedMunicipality] =
    useState<MunicipalityOption | null>(initialMunicipality);
  const [municipalityInput, setMunicipalityInput] = useState(
    defaultMunicipality?.fullName ??
      (initialMunicipality ? formatMunicipalityLabel(initialMunicipality) : "")
  );
  const [municipalityOptions, setMunicipalityOptions] = useState<
    MunicipalityOption[]
  >(initialMunicipality ? [initialMunicipality] : []);
  const [municipalityLoading, setMunicipalityLoading] = useState(false);
  const municipalitySearchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const nextDefault = mapDefaultMunicipalityToOption(defaultMunicipality);
    if (!nextDefault) {
      return;
    }

    setSelectedMunicipality(nextDefault);
    setMunicipalityInput(
      defaultMunicipality?.fullName ?? formatMunicipalityLabel(nextDefault)
    );
    setMunicipalityOptions((previous) => {
      if (previous.some((option) => option.id === nextDefault.id)) {
        return previous;
      }
      return [nextDefault, ...previous].slice(0, 10);
    });
  }, [defaultMunicipality]);

  useEffect(() => {
    const trimmed = municipalityInput.trim();
    if (!trimmed) {
      setMunicipalityOptions((previous) => {
        if (selectedMunicipality) {
          const exists = previous.some(
            (option) => option.id === selectedMunicipality.id
          );
          if (exists) {
            return previous;
          }
          return [selectedMunicipality, ...previous];
        }
        return [];
      });
      return;
    }

    municipalitySearchAbortRef.current?.abort();
    const controller = new AbortController();
    municipalitySearchAbortRef.current = controller;

    const handler = setTimeout(async () => {
      try {
        setMunicipalityLoading(true);
        const response = await fetch(
          `/api/municipalities/search?q=${encodeURIComponent(trimmed)}&take=10`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error("自治体検索に失敗しました。");
        }
        const data = (await response.json()) as {
          municipalities: MunicipalityOption[];
        };

        setMunicipalityOptions(() => {
          if (
            selectedMunicipality &&
            !data.municipalities.some(
              (option) => option.id === selectedMunicipality.id
            )
          ) {
            return [selectedMunicipality, ...data.municipalities];
          }
          return data.municipalities;
        });
      } catch (fetchError) {
        if (
          !(fetchError instanceof DOMException) ||
          fetchError.name !== "AbortError"
        ) {
          console.error(fetchError);
        }
      } finally {
        setMunicipalityLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
      controller.abort();
    };
  }, [municipalityInput, selectedMunicipality]);

  useEffect(() => {
    return () => {
      municipalitySearchAbortRef.current?.abort();
    };
  }, []);

  const handleMunicipalityChange = useCallback(
    (
      _: unknown,
      value: MunicipalityOption | null,
      reason: AutocompleteChangeReason
    ) => {
      if (reason === "clear") {
        setSelectedMunicipality(null);
        return;
      }

      setSelectedMunicipality(value);
      if (value) {
        setMunicipalityInput(formatMunicipalityLabel(value));
        setError(null);
      }
    },
    []
  );

  const handleMunicipalityInputChange = useCallback(
    (_: unknown, value: string, reason: AutocompleteInputChangeReason) => {
      if (reason === "input") {
        setMunicipalityInput(value);
      } else if (reason === "clear") {
        setMunicipalityInput("");
      } else if (reason === "reset") {
        setMunicipalityInput(value);
      }
    },
    []
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selected = event.target.files?.[0] ?? null;
      setFile(selected);
      if (selected) {
        setError(null);
      }
    },
    []
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedMunicipality) {
        setError("自治体を選択してください。");
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
            municipalityId: selectedMunicipality.id,
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
    [file, notes, router, selectedMunicipality, uploaderId]
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

        {defaultMunicipality ? (
          <Alert severity="info">
            対象自治体:{" "}
            {defaultMunicipality.fullName ??
              `${defaultMunicipality.prefecture} ${defaultMunicipality.name}`}
            （ID: {defaultMunicipality.id}）
          </Alert>
        ) : null}

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Autocomplete
          options={municipalityOptions}
          value={selectedMunicipality}
          inputValue={municipalityInput}
          onChange={handleMunicipalityChange}
          onInputChange={handleMunicipalityInputChange}
          loading={municipalityLoading}
          filterOptions={(options) => options}
          getOptionLabel={(option) => formatMunicipalityLabel(option)}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          noOptionsText={
            municipalityInput.trim()
              ? "候補が見つかりません"
              : "自治体名を入力してください"
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="対象自治体"
              placeholder="自治体名や都道府県名で検索"
              helperText="検索結果から対象自治体を選択してください"
              required
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {municipalityLoading ? (
                      <CircularProgress color="inherit" size={16} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Stack spacing={0.25}>
                <Typography variant="body2">
                  {formatMunicipalityLabel(option)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  行政コード: {option.code}
                </Typography>
              </Stack>
            </li>
          )}
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
