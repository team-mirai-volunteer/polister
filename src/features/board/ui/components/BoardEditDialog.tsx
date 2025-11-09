"use client";

/**
 * 掲示板編集ダイアログ
 */

import { getBoardDetailAction } from "@/features/board/application/actions/getBoardDetailAction";
import { updateBoardAction } from "@/features/board/application/actions/updateBoardAction";
import type {
  BoardDetailDTO,
  GetBoardDetailResponseDTO,
} from "@/features/board/application/dto/BoardDetailDTO";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { BoardLocationMapEditor } from "./BoardLocationMapEditor";

interface BoardEditDialogProps {
  open: boolean;
  board: BoardDetailDTO;
  onClose: () => void;
  onSuccess: (data: GetBoardDetailResponseDTO) => void;
}

const TRUST_LEVELS = [
  { value: "LEVEL_1", label: "公式" },
  { value: "LEVEL_2", label: "確認済み" },
  { value: "LEVEL_3", label: "報告" },
  { value: "LEVEL_4", label: "記憶" },
];

const STATUSES = [
  { value: "PENDING", label: "未検証" },
  { value: "VERIFIED", label: "検証済み" },
  { value: "REJECTED", label: "却下" },
];

const CHANGE_REASONS = [
  { value: "MANUAL_INPUT", label: "手動入力" },
  { value: "ERROR_CORRECTION", label: "エラー修正" },
  { value: "FIELD_VERIFICATION", label: "現地確認" },
];

export function BoardEditDialog({
  open,
  board,
  onClose,
  onSuccess,
}: BoardEditDialogProps) {
  // 初期位置を保持（座標がnullの場合は東京駅をデフォルト）
  const initialPosition = useMemo(
    () => ({
      latitude: board.latitude ?? 35.6812,
      longitude: board.longitude ?? 139.7671,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // 空の依存配列で初回のみ計算
  );

  // 初期フォームデータを生成する関数
  const createInitialFormData = useMemo(
    () => ({
      boardNumber: board.boardNumber || "",
      name: board.name || "",
      address: board.address,
      latitude: board.latitude ?? 35.6812,
      longitude: board.longitude ?? 139.7671,
      latitudeStr: board.latitude?.toString() ?? "35.6812",
      longitudeStr: board.longitude?.toString() ?? "139.7671",
      status: board.status,
      trustLevel: board.trustLevel,
      note: board.note || "",
      changeReason: "MANUAL_INPUT" as
        | "MANUAL_INPUT"
        | "ERROR_CORRECTION"
        | "FIELD_VERIFICATION",
      comment: "",
    }),
    [
      board.boardNumber,
      board.name,
      board.address,
      board.latitude,
      board.longitude,
      board.status,
      board.trustLevel,
      board.note,
    ]
  );

  const [formData, setFormData] = useState(createInitialFormData);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ダイアログが開かれた時、またはboardが変更された時にフォームをリセット
  useEffect(() => {
    if (open) {
      setFormData(createInitialFormData);
      setError(null);
    }
  }, [open, createInitialFormData]);

  const handleResetLocation = () => {
    setFormData({
      ...formData,
      latitude: initialPosition.latitude,
      longitude: initialPosition.longitude,
      latitudeStr: initialPosition.latitude.toString(),
      longitudeStr: initialPosition.longitude.toString(),
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateBoardAction({
        boardId: board.id,
        boardNumber: formData.boardNumber || null,
        name: formData.name || null,
        address: formData.address,
        coordinates: {
          latitude: formData.latitude,
          longitude: formData.longitude,
        },
        status: formData.status as "PENDING" | "VERIFIED" | "REJECTED",
        trustLevel: formData.trustLevel as
          | "LEVEL_1"
          | "LEVEL_2"
          | "LEVEL_3"
          | "LEVEL_4",
        note: formData.note || null,
        changeReason: formData.changeReason,
        comment: formData.comment || null,
      });

      if (!result.success) {
        setError(result.error?.message || "更新に失敗しました。");
        setLoading(false);
        return;
      }

      // 最新データを取得
      const updatedData = await getBoardDetailAction(board.id);
      if (updatedData) {
        onSuccess(updatedData);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "予期しないエラーが発生しました。"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>掲示板情報を編集</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: "grid", gap: 2, pt: 1 }}>
          <TextField
            label="掲示板番号"
            value={formData.boardNumber}
            onChange={(e) =>
              setFormData({ ...formData, boardNumber: e.target.value })
            }
            fullWidth
          />

          <TextField
            label="名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
          />

          <TextField
            label="住所"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            fullWidth
            required
          />

          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="subtitle2">
                位置情報（地図上でマーカーをドラッグして調整できます）
              </Typography>
              <Tooltip title="初期位置に戻す">
                <IconButton
                  size="small"
                  onClick={handleResetLocation}
                  disabled={
                    formData.latitude === initialPosition.latitude &&
                    formData.longitude === initialPosition.longitude
                  }
                >
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <BoardLocationMapEditor
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationChange={(lat, lng) => {
                setFormData({
                  ...formData,
                  latitude: lat,
                  longitude: lng,
                  latitudeStr: lat.toString(),
                  longitudeStr: lng.toString(),
                });
              }}
              height={250}
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField
              label="緯度"
              type="number"
              value={formData.latitudeStr}
              onChange={(e) => {
                const value = e.target.value;
                const parsed = parseFloat(value);
                setFormData({
                  ...formData,
                  latitudeStr: value,
                  latitude: Number.isFinite(parsed)
                    ? parsed
                    : formData.latitude,
                });
              }}
              inputProps={{ step: 0.000001 }}
              required
            />

            <TextField
              label="経度"
              type="number"
              value={formData.longitudeStr}
              onChange={(e) => {
                const value = e.target.value;
                const parsed = parseFloat(value);
                setFormData({
                  ...formData,
                  longitudeStr: value,
                  longitude: Number.isFinite(parsed)
                    ? parsed
                    : formData.longitude,
                });
              }}
              inputProps={{ step: 0.000001 }}
              required
            />
          </Box>

          <FormControl fullWidth>
            <InputLabel>信頼度</InputLabel>
            <Select
              value={formData.trustLevel}
              label="信頼度"
              onChange={(e) =>
                setFormData({ ...formData, trustLevel: e.target.value })
              }
            >
              {TRUST_LEVELS.map((level) => (
                <MenuItem key={level.value} value={level.value}>
                  {level.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>ステータス</InputLabel>
            <Select
              value={formData.status}
              label="ステータス"
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              {STATUSES.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="備考"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />

          <FormControl fullWidth required>
            <InputLabel>変更理由</InputLabel>
            <Select
              value={formData.changeReason}
              label="変更理由"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  changeReason: e.target.value as
                    | "MANUAL_INPUT"
                    | "ERROR_CORRECTION"
                    | "FIELD_VERIFICATION",
                })
              }
            >
              {CHANGE_REASONS.map((reason) => (
                <MenuItem key={reason.value} value={reason.value}>
                  {reason.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="変更コメント"
            value={formData.comment}
            onChange={(e) =>
              setFormData({ ...formData, comment: e.target.value })
            }
            multiline
            rows={2}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          キャンセル
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? "保存中..." : "保存"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
