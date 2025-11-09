"use client";

/**
 * 掲示板変更履歴一覧コンポーネント
 */

import type { BoardHistoryDTO } from "@/features/board/application/dto/BoardDetailDTO";
import {
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  Typography,
} from "@mui/material";

interface BoardHistoryListProps {
  histories: BoardHistoryDTO[];
}

const CHANGE_REASON_LABELS: Record<string, string> = {
  MANUAL_INPUT: "手動入力",
  DATA_SOURCE_IMPORT: "データインポート",
  FIELD_VERIFICATION: "現地確認",
  ERROR_CORRECTION: "エラー修正",
  DATA_NORMALIZATION: "データ正規化",
  GEOCODING_UPDATE: "ジオコーディング更新",
  MIGRATION: "マイグレーション",
  SYSTEM_UPDATE: "システム更新",
  OTHER: "その他",
};

const FIELD_LABELS: Record<string, string> = {
  boardNumber: "掲示板番号",
  name: "名称",
  address: "住所",
  coordinates: "位置情報",
  status: "ステータス",
  trustLevel: "信頼度",
  note: "備考",
};

export function BoardHistoryList({ histories }: BoardHistoryListProps) {
  if (histories.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            変更履歴
          </Typography>
          <Typography variant="body2" color="text.secondary">
            変更履歴はありません。
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          変更履歴
        </Typography>
        <List dense>
          {histories.map((history) => (
            <ListItem
              key={history.id}
              sx={{
                display: "block",
                px: 0,
                borderBottom: 1,
                borderColor: "divider",
                "&:last-child": { borderBottom: 0 },
              }}
            >
              <Box sx={{ mb: 1 }}>
                <Chip
                  label={
                    CHANGE_REASON_LABELS[history.changeReason] ||
                    history.changeReason
                  }
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {new Date(history.changedAt).toLocaleString("ja-JP")}
                </Typography>
              </Box>

              {history.comment && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {history.comment}
                </Typography>
              )}

              {history.changes.length > 0 && (
                <Box>
                  {history.changes.map((change, index) => (
                    <Typography
                      key={index}
                      variant="caption"
                      component="div"
                      color="text.secondary"
                    >
                      {FIELD_LABELS[change.field] || change.field}:{" "}
                      <Box
                        component="span"
                        sx={{ textDecoration: "line-through" }}
                      >
                        {String(change.before ?? "-")}
                      </Box>
                      {" → "}
                      {String(change.after ?? "-")}
                    </Typography>
                  ))}
                </Box>
              )}
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
