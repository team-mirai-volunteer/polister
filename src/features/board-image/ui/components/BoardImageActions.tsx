"use client";

import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateBoardImageAction } from "../../application/actions/updateBoardImageAction";
import { updateBoardNumberAction } from "../../application/actions/updateBoardNumberAction";

interface BoardImageActionsProps {
  imageId: string;
  currentBoardNumber?: string | null;
}

export function BoardImageActions({
  imageId,
  currentBoardNumber,
}: BoardImageActionsProps) {
  const router = useRouter();
  const [boardNumber, setBoardNumber] = useState(currentBoardNumber || "");

  const handleSaveBoardNumber = async () => {
    const result = await updateBoardNumberAction(imageId, boardNumber);

    if (result.success) {
      alert(result.message);
      router.refresh(); // 候補掲示場を再計算
    } else {
      alert(`エラー: ${result.message}`);
    }
  };

  const handleAction = async (
    action: "no_number" | "location_issue" | "duplicate" | "rejected",
    label: string
  ) => {
    const confirmed = confirm(`この画像を「${label}」に設定しますか？`);
    if (!confirmed) return;

    const result = await updateBoardImageAction({
      imageId,
      action,
    });

    if (result.success) {
      alert(`${label}に設定しました`);
      router.refresh();
    } else {
      alert(`エラー: ${result.message}`);
    }
  };

  return (
    <Stack spacing={2}>
      {/* 掲示場番号入力 */}
      <Box>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <TextField
            label="掲示場番号"
            value={boardNumber}
            onChange={(e) => setBoardNumber(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            placeholder="例: 41-5"
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleSaveBoardNumber}
            sx={{ minWidth: 60, height: 40 }}
          >
            保存
          </Button>
        </Stack>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mt: 0.5 }}
        >
          画像から読み取った掲示場番号を入力
        </Typography>
      </Box>

      {/* ステータス変更ボタン */}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button
          variant="outlined"
          color="info"
          size="small"
          onClick={() => handleAction("no_number", "番号不明")}
        >
          番号不明
        </Button>
        <Button
          variant="outlined"
          color="warning"
          size="small"
          onClick={() => handleAction("location_issue", "位置情報不明")}
        >
          位置情報不明
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleAction("duplicate", "重複")}
        >
          重複
        </Button>
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={() => handleAction("rejected", "対象外")}
        >
          対象外
        </Button>
      </Stack>
    </Stack>
  );
}
