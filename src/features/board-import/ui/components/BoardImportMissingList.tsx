import type { BoardImportMissingDTO } from "@/features/board-import/application/dto/BoardImportBatchDTO";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

export interface BoardImportMissingListProps {
  items: BoardImportMissingDTO[];
}

export function BoardImportMissingList({ items }: BoardImportMissingListProps) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        CSVに存在しない既存掲示場はありません。
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
            <TableCell>欠落掲示場ID</TableCell>
            <TableCell>理由</TableCell>
            <TableCell>決定</TableCell>
            <TableCell>コメント</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.boardId}</TableCell>
              <TableCell>{item.reason}</TableCell>
              <TableCell>{item.finalDecision ?? "未決定"}</TableCell>
              <TableCell>{item.comment ?? ""}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
