import type { BoardImportBatchDTO } from "@/features/board-import/application/dto/BoardImportBatchDTO";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Link from "next/link";

export interface BoardImportBatchListProps {
  batches: BoardImportBatchDTO[];
}

const STATUS_LABELS: Record<string, string> = {
  UPLOADED: "アップロード済み",
  REVIEWING: "レビュー中",
  APPLIED: "反映済み",
  CANCELLED: "キャンセル",
};

export function BoardImportBatchList({ batches }: BoardImportBatchListProps) {
  if (batches.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        まだインポートバッチが存在しません。
      </Typography>
    );
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ border: "1px solid", borderColor: "divider" }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>バッチID</TableCell>
            <TableCell>ステータス</TableCell>
            <TableCell align="right">総件数</TableCell>
            <TableCell align="right">新規</TableCell>
            <TableCell align="right">更新</TableCell>
            <TableCell align="right">欠落</TableCell>
            <TableCell>アップロード日時</TableCell>
            <TableCell>担当者</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {batches.map((batch) => (
            <TableRow key={batch.id} hover>
              <TableCell>
                <Link href={`/board-imports/${batch.id}`}>{batch.id}</Link>
              </TableCell>
              <TableCell>
                <Chip
                  label={STATUS_LABELS[batch.status] ?? batch.status}
                  size="small"
                  color={
                    batch.status === "APPLIED"
                      ? "success"
                      : batch.status === "REVIEWING"
                        ? "warning"
                        : "default"
                  }
                />
              </TableCell>
              <TableCell align="right">
                {batch.totalRows.toLocaleString()}
              </TableCell>
              <TableCell align="right">
                {batch.newCount.toLocaleString()}
              </TableCell>
              <TableCell align="right">
                {batch.updatedCount.toLocaleString()}
              </TableCell>
              <TableCell align="right">
                {batch.missingCount.toLocaleString()}
              </TableCell>
              <TableCell>
                {new Date(batch.uploadedAt).toLocaleString("ja-JP")}
              </TableCell>
              <TableCell>{batch.uploadedBy}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
