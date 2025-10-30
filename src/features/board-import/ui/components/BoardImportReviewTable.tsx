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
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

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
const ROW_HEIGHT = 104;
const OVERSCAN_COUNT = 6;
const COLUMN_COUNT = 12;

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
  const [pendingRowIds, setPendingRowIds] = useState<Set<string>>(
    () => new Set()
  );
  const [isPending, startTransition] = useTransition();
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    () => rows[0]?.id ?? null
  );
  const activeSelectedId = selectedRowId ?? internalSelectedId;
  const commentRollbackRef = useRef<Map<string, string | null>>(new Map());
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setItems(rows);
    setPendingRowIds(new Set());
    setInternalSelectedId((current) => {
      if (current && rows.some((row) => row.id === current)) {
        return current;
      }
      return rows[0]?.id ?? null;
    });
    commentRollbackRef.current.clear();
    const container = tableContainerRef.current;
    if (container) {
      container.scrollTop = 0;
    }
  }, [rows]);

  useEffect(() => {
    const cleanup = () => {
      commentRollbackRef.current.clear();
    };
    return cleanup;
  }, []);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const updateViewport = () => {
      setViewportHeight(container.clientHeight);
    };

    handleScroll();
    updateViewport();

    container.addEventListener("scroll", handleScroll);

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateViewport);
      resizeObserver.observe(container);
    }

    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver?.disconnect();
    };
  }, []);

  const { visibleRows, topPaddingHeight, bottomPaddingHeight } = useMemo(() => {
    if (items.length === 0) {
      return {
        visibleRows: [] as BoardImportRowDTO[],
        topPaddingHeight: 0,
        bottomPaddingHeight: 0,
      };
    }

    const effectiveViewport =
      viewportHeight > 0 ? viewportHeight : ROW_HEIGHT * 10;
    const visibleCount =
      Math.max(1, Math.ceil(effectiveViewport / ROW_HEIGHT)) +
      OVERSCAN_COUNT * 2;
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_COUNT
    );
    const endIndex = Math.min(items.length, startIndex + visibleCount);

    return {
      visibleRows: items.slice(startIndex, endIndex),
      topPaddingHeight: startIndex * ROW_HEIGHT,
      bottomPaddingHeight: Math.max(0, (items.length - endIndex) * ROW_HEIGHT),
    };
  }, [items, scrollTop, viewportHeight]);

  const applyServerUpdate = (
    rowId: string,
    payload: {
      decision: BoardImportRowDTO["finalDecision"];
      comment: string | null;
    },
    rollback: BoardImportRowDTO,
    onSettled?: () => void
  ) => {
    setPendingRowIds((previous) => {
      const next = new Set(previous);
      next.add(rowId);
      return next;
    });

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
        setPendingRowIds((previous) => {
          const next = new Set(previous);
          next.delete(rowId);
          return next;
        });
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
        ref={tableContainerRef}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          flexGrow: 1,
          minHeight: 0,
          maxHeight: 560,
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
            {topPaddingHeight > 0 ? (
              <TableRow
                key="virtual-top-padding"
                sx={{ height: topPaddingHeight }}
              >
                <TableCell
                  colSpan={COLUMN_COUNT}
                  sx={{ borderBottom: 0, padding: 0 }}
                />
              </TableRow>
            ) : null}
            {visibleRows.map((row) => {
              const matched = row.matchedBoard;
              const isRowPending = pendingRowIds.has(row.id) && isPending;
              const isSelected = row.id === activeSelectedId;

              return (
                <TableRow
                  key={row.id}
                  hover
                  selected={isSelected}
                  onClick={() => handleRowSelect(row)}
                  sx={{
                    cursor: "pointer",
                    height: ROW_HEIGHT,
                  }}
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
                      {row.latitude != null ? row.latitude.toFixed(6) : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {row.longitude != null ? row.longitude.toFixed(6) : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {matched?.latitude != null
                        ? matched.latitude.toFixed(6)
                        : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {matched?.longitude != null
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
            {bottomPaddingHeight > 0 ? (
              <TableRow
                key="virtual-bottom-padding"
                sx={{ height: bottomPaddingHeight }}
              >
                <TableCell
                  colSpan={COLUMN_COUNT}
                  sx={{ borderBottom: 0, padding: 0 }}
                />
              </TableRow>
            ) : null}
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
