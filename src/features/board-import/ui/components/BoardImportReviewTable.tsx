"use client";

import { updateBoardImportRowDecisionAction } from "@/features/board-import/application/actions/updateBoardImportRowDecisionAction";
import type { BoardImportRowDTO } from "@/features/board-import/application/dto/BoardImportBatchDTO";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Snackbar from "@mui/material/Snackbar";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRef, useState, useTransition } from "react";

const DECISION_OPTIONS: Array<{
  value: BoardImportRowDTO["finalDecision"];
  label: string;
}> = [
  { value: null, label: "未決定" },
  { value: "CREATE", label: "新規作成" },
  { value: "UPDATE", label: "既存更新" },
  { value: "IGNORE", label: "変更なし" },
];

const MATCH_CONFIDENCE_LABELS: Record<string, string> = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
  NONE: "なし",
};

const DECISION_NULL_PLACEHOLDER = "__null__" as const;

const decisionToSelectValue = (
  decision: BoardImportRowDTO["finalDecision"]
): string => decision ?? DECISION_NULL_PLACEHOLDER;

const selectValueToDecision = (
  value: string
): BoardImportRowDTO["finalDecision"] =>
  value === DECISION_NULL_PLACEHOLDER
    ? null
    : (value as BoardImportRowDTO["finalDecision"]);

export interface BoardImportReviewTableProps {
  rows: BoardImportRowDTO[];
  selectedRowId?: string | null;
  onSelectRow?: (row: BoardImportRowDTO) => void;
}

export function BoardImportReviewTable({
  rows,
  selectedRowId,
  onSelectRow,
}: BoardImportReviewTableProps) {
  const [items, setItems] = useState(rows);
  const [pendingRowId, setPendingRowId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    () => rows[0]?.id ?? null
  );
  const activeSelectedId = selectedRowId ?? internalSelectedId;
  const commentRollbackRef = useRef<Map<string, string | null>>(new Map());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const applyServerUpdate = (
    rowId: string,
    payload: {
      decision: BoardImportRowDTO["finalDecision"];
      comment: string | null;
    },
    rollback: BoardImportRowDTO,
    onSettled?: () => void
  ) => {
    setPendingRowId(rowId);

    startTransition(async () => {
      try {
        const result = await updateBoardImportRowDecisionAction({
          rowId,
          decision: payload.decision,
          assigneeId: rollback.assigneeId ?? null,
          comment: payload.comment,
        });

        setItems((previous) =>
          previous.map((row) => (row.id === rowId ? result : row))
        );
      } catch (error) {
        setItems((previous) =>
          previous.map((row) => (row.id === rowId ? rollback : row))
        );
        console.error("[BoardImportReviewTable] Failed to update row", error);
        setErrorMessage("更新に失敗しました。再度お試しください。");
      } finally {
        setPendingRowId(null);
        onSettled?.();
      }
    });
  };

  const handleDecisionChange = (
    row: BoardImportRowDTO,
    decision: BoardImportRowDTO["finalDecision"]
  ) => {
    const before = { ...row };
    const optimistic: BoardImportRowDTO = { ...row, finalDecision: decision };
    setItems((previous) =>
      previous.map((item) => (item.id === row.id ? optimistic : item))
    );

    applyServerUpdate(
      row.id,
      { decision, comment: optimistic.comment ?? null },
      before
    );
  };

  const handleCommentChange = (row: BoardImportRowDTO, comment: string) => {
    if (!commentRollbackRef.current.has(row.id)) {
      commentRollbackRef.current.set(row.id, row.comment ?? null);
    }
    setItems((previous) =>
      previous.map((item) => (item.id === row.id ? { ...item, comment } : item))
    );
  };

  const handleCommentBlur = (row: BoardImportRowDTO) => {
    const current = items.find((item) => item.id === row.id) ?? row;
    const previousComment =
      commentRollbackRef.current.get(row.id) ?? row.comment ?? null;
    const rollback: BoardImportRowDTO = { ...row, comment: previousComment };
    applyServerUpdate(
      row.id,
      { decision: current.finalDecision, comment: current.comment ?? null },
      rollback,
      () => {
        commentRollbackRef.current.delete(row.id);
      }
    );
  };

  const handleRowSelect = (row: BoardImportRowDTO) => {
    setInternalSelectedId(row.id);
    onSelectRow?.(row);
  };

  return (
    <>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          flexGrow: 1,
          minHeight: 0,
          maxHeight: "100%",
          overflow: "auto",
        }}
      >
        <Table
          size="small"
          sx={{
            minWidth: "100%",
            tableLayout: "fixed",
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>番号</TableCell>
              <TableCell>インポート名・住所</TableCell>
              <TableCell>既存掲示板</TableCell>
              <TableCell align="right">距離(m)</TableCell>
              <TableCell>CSV緯度</TableCell>
              <TableCell>CSV経度</TableCell>
              <TableCell>既存緯度</TableCell>
              <TableCell>既存経度</TableCell>
              <TableCell>信頼度</TableCell>
              <TableCell>推奨</TableCell>
              <TableCell>決定</TableCell>
              <TableCell>コメント</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((row) => {
              const matched = row.matchedBoard;
              const isRowPending = pendingRowId === row.id && isPending;
              const isSelected = row.id === activeSelectedId;

              return (
                <TableRow
                  key={row.id}
                  hover
                  selected={isSelected}
                  onClick={() => handleRowSelect(row)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>{row.boardNumber ?? "-"}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {row.name ?? "名称なし"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.address}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {matched ? (
                      <Box>
                        <Typography variant="body2">
                          {matched.name ?? "名称なし"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {matched.address}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        未マッチ
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {row.distanceMeter !== null
                      ? row.distanceMeter.toFixed(1)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {Number.isFinite(row.latitude)
                        ? row.latitude.toFixed(6)
                        : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {Number.isFinite(row.longitude)
                        ? row.longitude.toFixed(6)
                        : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {matched?.latitude !== null &&
                      matched?.latitude !== undefined
                        ? matched.latitude.toFixed(6)
                        : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {matched?.longitude !== null &&
                      matched?.longitude !== undefined
                        ? matched.longitude.toFixed(6)
                        : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {MATCH_CONFIDENCE_LABELS[row.matchConfidence] ??
                      row.matchConfidence}
                  </TableCell>
                  <TableCell>{row.suggestedAction}</TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={decisionToSelectValue(row.finalDecision)}
                      onChange={(event) =>
                        handleDecisionChange(
                          row,
                          selectValueToDecision(event.target.value as string)
                        )
                      }
                      disabled={isRowPending}
                      displayEmpty
                    >
                      {DECISION_OPTIONS.map((option) => (
                        <MenuItem
                          key={option.label}
                          value={decisionToSelectValue(option.value)}
                        >
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <TextField
                      size="small"
                      fullWidth
                      value={row.comment ?? ""}
                      onChange={(event) =>
                        handleCommentChange(row, event.target.value)
                      }
                      onBlur={() => handleCommentBlur(row)}
                      disabled={isRowPending}
                    />
                    {isRowPending ? (
                      <CircularProgress size={16} sx={{ mt: 0.5 }} />
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={4000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setErrorMessage(null)}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
