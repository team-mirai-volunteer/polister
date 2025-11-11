"use client";

import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PlaceIcon from "@mui/icons-material/Place";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

interface MunicipalityOption {
  id: string;
  name: string;
  prefecture: string;
  code: string;
}

interface UploadResult {
  id: string;
  previewUrl: string;
  originalUrl: string;
  latitude: number | null;
  longitude: number | null;
  municipality: {
    id: string;
    name: string;
    prefecture: string;
  };
}

interface ExifLocation {
  latitude: number | null;
  longitude: number | null;
}

export function BoardImageUploadForm() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exifLocation, setExifLocation] = useState<ExifLocation | null>(null);
  const [exifLoading, setExifLoading] = useState(false);
  const [municipalityInput, setMunicipalityInput] = useState("");
  const [municipalityOptions, setMunicipalityOptions] = useState<
    MunicipalityOption[]
  >([]);
  const [municipalityLoading, setMunicipalityLoading] = useState(false);
  const [selectedMunicipality, setSelectedMunicipality] =
    useState<MunicipalityOption | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setExifLocation(null);
    setSuccessMessage(null);
    setUploadResult(null);
    setError(null);

    try {
      setExifLoading(true);
      const exifrModule = await import("exifr");
      const gpsParser = (
        exifrModule as unknown as {
          gps?: (file: File) => Promise<Record<string, number | undefined>>;
        }
      ).gps;
      const gpsData = gpsParser ? await gpsParser(file) : null;
      if (gpsData && (gpsData.latitude || gpsData.longitude)) {
        setExifLocation({
          latitude: gpsData.latitude ?? null,
          longitude: gpsData.longitude ?? null,
        });
      } else {
        setExifLocation({ latitude: null, longitude: null });
      }
    } catch (exifError) {
      console.warn("Exif解析に失敗しました", exifError);
      setExifLocation({ latitude: null, longitude: null });
    } finally {
      setExifLoading(false);
    }
  };

  useEffect(() => {
    if (!municipalityInput.trim()) {
      setMunicipalityOptions([]);
      return;
    }

    searchAbortControllerRef.current?.abort();
    const controller = new AbortController();
    searchAbortControllerRef.current = controller;
    const handler = setTimeout(async () => {
      try {
        setMunicipalityLoading(true);
        const response = await fetch(
          `/api/municipalities/search?q=${encodeURIComponent(municipalityInput.trim())}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error("検索に失敗しました");
        }
        const data = (await response.json()) as {
          municipalities: MunicipalityOption[];
        };
        setMunicipalityOptions(data.municipalities);
      } catch (fetchError) {
        if ((fetchError as DOMException).name !== "AbortError") {
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
  }, [municipalityInput]);

  const canUpload = useMemo(() => {
    return Boolean(selectedFile && selectedMunicipality && !uploading);
  }, [selectedFile, selectedMunicipality, uploading]);

  const handleUpload = async () => {
    if (!selectedFile || !selectedMunicipality) {
      setError("自治体と写真を選択してください");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("municipalityId", selectedMunicipality.id);

      const response = await fetch("/api/board-images/upload", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "アップロードに失敗しました");
      }

      setUploadResult(payload.image as UploadResult);
      setSuccessMessage("アップロードが完了しました");

      // 完了後は掲示場写真詳細へ遷移
      router.push(`/board-images/${(payload.image as UploadResult).id}`);
    } catch (uploadError) {
      console.error(uploadError);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "アップロードに失敗しました"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack spacing={4}>
      {error && <Alert severity="error">{error}</Alert>}
      {successMessage && <Alert severity="success">{successMessage}</Alert>}

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                1. 自治体を選択
              </Typography>
              <Autocomplete
                options={municipalityOptions}
                loading={municipalityLoading}
                value={selectedMunicipality}
                onChange={(_, value) => {
                  setSelectedMunicipality(value);
                  setSuccessMessage(null);
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                inputValue={municipalityInput}
                onInputChange={(_, value) => setMunicipalityInput(value)}
                getOptionLabel={(option) =>
                  `${option.prefecture} ${option.name}`
                }
                noOptionsText={
                  municipalityInput
                    ? "該当する自治体が見つかりません"
                    : "自治体名を入力してください"
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="自治体を検索"
                    placeholder="例: 東京都 渋谷区"
                    helperText="自治体の選択は必須です"
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {municipalityLoading ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                2. 写真をアップロード
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<AddPhotoAlternateIcon />}
                sx={{ alignSelf: "flex-start" }}
              >
                写真を選択
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
            </Box>

            {selectedFile && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  選択中: {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
                {previewUrl && (
                  <Box
                    component="img"
                    src={previewUrl}
                    alt="プレビュー"
                    sx={{
                      width: "100%",
                      maxHeight: 360,
                      objectFit: "contain",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "grey.50",
                    }}
                  />
                )}
                <Stack direction="row" spacing={2} alignItems="center" mt={2}>
                  <PlaceIcon color="action" />
                  {exifLoading ? (
                    <Typography variant="body2" color="text.secondary">
                      Exif情報を解析中...
                    </Typography>
                  ) : exifLocation?.latitude || exifLocation?.longitude ? (
                    <Typography variant="body2">
                      Exif位置情報: {exifLocation.latitude?.toFixed(6) ?? "-"},{" "}
                      {exifLocation.longitude?.toFixed(6) ?? "-"}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Exifに位置情報は含まれていません
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}

            <Box>
              <Button
                variant="contained"
                startIcon={
                  uploading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <CloudUploadIcon />
                  )
                }
                disabled={!canUpload}
                onClick={handleUpload}
              >
                アップロード
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {uploadResult && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">アップロード結果</Typography>
              <Box
                component="img"
                src={uploadResult.previewUrl}
                alt="アップロード済み画像"
                sx={{
                  width: "100%",
                  maxHeight: 360,
                  objectFit: "contain",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "grey.50",
                }}
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={`${uploadResult.municipality.prefecture} ${uploadResult.municipality.name}`}
                  color="primary"
                  size="small"
                />
              </Stack>
              <Typography variant="body2">
                位置情報: {uploadResult.latitude?.toFixed(6) ?? "-"},{" "}
                {uploadResult.longitude?.toFixed(6) ?? "-"}
              </Typography>
              <Button
                variant="text"
                href={uploadResult.originalUrl}
                target="_blank"
                rel="noreferrer"
                sx={{ alignSelf: "flex-start" }}
              >
                オリジナル画像を開く
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
