"use client";

import { updateBoardImportRowDecisionAction } from "@/features/board-import/application/actions/updateBoardImportRowDecisionAction";
import type { BoardImportRowDTO } from "@/features/board-import/application/dto/BoardImportBatchDTO";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

const DECISION_OPTIONS: Array<{
  value: BoardImportRowDTO["finalDecision"];
  label: string;
}> = [
  { value: null, label: "未決定" },
  { value: "CREATE", label: "新規作成" },
  { value: "UPDATE", label: "既存更新" },
  { value: "IGNORE", label: "変更なし" },
];

const formatTextValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
};

const formatLatLngValue = (value: string | number | null | undefined) => {
  if (typeof value === "number") {
    return value.toFixed(6);
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(6) : "-";
  }
  return "-";
};

const renderDiffValue = (
  existing: string | number | null | undefined,
  current: string | number | null | undefined,
  hasDiff: boolean,
  options?: {
    variant?: "body2" | "caption";
    formatter?: (value: string | number | null | undefined) => string;
  }
) => {
  const variant = options?.variant ?? "body2";
  const formatter =
    options?.formatter ??
    ((value: string | number | null | undefined) => {
      if (value === null || value === undefined || value === "") {
        return "-";
      }
      return String(value);
    });

  const formattedExisting = formatter(existing);
  const formattedCurrent = formatter(current);

  let content: React.ReactNode;
  if (!hasDiff) {
    content = <Typography variant={variant}>{formattedExisting}</Typography>;
  } else if (existing === null || existing === undefined) {
    content = (
      <Typography variant={variant} color="error">
        {formattedCurrent}
      </Typography>
    );
  } else {
    content = (
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        flexWrap="nowrap"
      >
        <Typography variant={variant}>{formattedExisting}</Typography>
        <Typography variant={variant} color="text.secondary">
          →
        </Typography>
        <Typography variant={variant} color="error">
          {formattedCurrent}
        </Typography>
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        height: "100%",
        width: "100%",
      }}
    >
      {content}
    </Box>
  );
};

const DECISION_NULL_PLACEHOLDER = "__null__" as const;
const ACTION_CHIP_MAP: Record<
  BoardImportRowDTO["suggestedAction"],
  { label: string; color: "default" | "success" | "warning" | "error" | "info" }
> = {
  CREATE: { label: "新規", color: "success" },
  UPDATE: { label: "変更", color: "warning" },
  KEEP: { label: "変更なし", color: "default" },
  SKIP: { label: "削除候補", color: "error" },
};

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [commentDialogRow, setCommentDialogRow] =
    useState<BoardImportRowDTO | null>(null);
  const [commentDraft, setCommentDraft] = useState("");

  useEffect(() => {
    setItems(rows);
    setPendingRowIds(new Set());
    setInternalSelectedId((current) => {
      if (current && rows.some((row) => row.id === current)) {
        return current;
      }
      return rows[0]?.id ?? null;
    });
    setCommentDialogRow(null);
    setCommentDraft("");
  }, [rows]);

  const applyServerUpdate = useCallback(
    (
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
    },
    [setItems, setPendingRowIds, setErrorMessage, startTransition]
  );

  const handleDecisionChange = useCallback(
    (row: BoardImportRowDTO, decision: BoardImportRowDTO["finalDecision"]) => {
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
    },
    [applyServerUpdate]
  );

  const handleOpenCommentDialog = useCallback((row: BoardImportRowDTO) => {
    setCommentDialogRow(row);
    setCommentDraft(row.comment ?? "");
  }, []);

  const handleCloseCommentDialog = useCallback(() => {
    setCommentDialogRow(null);
    setCommentDraft("");
  }, []);

  const handleSaveComment = useCallback(() => {
    if (!commentDialogRow) {
      return;
    }
    const trimmed = commentDraft.trim();
    const nextComment = trimmed.length > 0 ? trimmed : null;
    const updatedRow: BoardImportRowDTO = {
      ...commentDialogRow,
      comment: nextComment,
    };
    setItems((previous) =>
      previous.map((item) => (item.id === updatedRow.id ? updatedRow : item))
    );
    applyServerUpdate(
      commentDialogRow.id,
      { decision: updatedRow.finalDecision, comment: nextComment },
      commentDialogRow
    );
    setCommentDialogRow(null);
    setCommentDraft("");
  }, [applyServerUpdate, commentDialogRow, commentDraft]);

  const handleRowSelect = useCallback(
    (row: BoardImportRowDTO) => {
      setInternalSelectedId(row.id);
      onSelectRow?.(row);
    },
    [onSelectRow]
  );

  const columns = useMemo<GridColDef<BoardImportRowDTO>[]>(
    () => [
      {
        field: "boardNumber",
        headerName: "番号",
        flex: 0.4,
        sortable: false,
        renderCell: (params) => params.row.boardNumber ?? "-",
      },
      {
        field: "suggestedAction",
        headerName: "種別",
        flex: 0.5,
        sortable: false,
        renderCell: (params) => {
          const chip = ACTION_CHIP_MAP[params.row.suggestedAction];
          return (
            <Chip
              size="small"
              sx={{ fontSize: "0.75rem", height: 22 }}
              label={chip?.label ?? "未分類"}
              color={chip?.color ?? "default"}
              variant={chip?.color === "default" ? "outlined" : "filled"}
            />
          );
        },
      },
      {
        field: "name",
        headerName: "名称",
        flex: 1,
        minWidth: 180,
        sortable: false,
        renderCell: (params) =>
          renderDiffValue(
            params.row.matchedBoard?.name ?? null,
            params.row.name ?? null,
            Boolean(params.row.diff?.name || !params.row.matchedBoard),
            { variant: "body2", formatter: formatTextValue }
          ),
      },
      {
        field: "address",
        headerName: "住所",
        flex: 1.2,
        minWidth: 220,
        sortable: false,
        renderCell: (params) =>
          renderDiffValue(
            params.row.matchedBoard?.address ?? null,
            params.row.address ?? null,
            Boolean(params.row.diff?.address || !params.row.matchedBoard),
            { variant: "caption", formatter: formatTextValue }
          ),
      },
      {
        field: "latitude",
        headerName: "緯度",
        flex: 0.8,
        sortable: false,
        renderCell: (params) =>
          renderDiffValue(
            params.row.matchedBoard?.latitude ?? null,
            params.row.latitude ?? null,
            Boolean(
              params.row.diff?.location ||
                (!params.row.matchedBoard && params.row.latitude !== null)
            ),
            {
              variant: "caption",
              formatter: formatLatLngValue,
            }
          ),
      },
      {
        field: "longitude",
        headerName: "経度",
        flex: 0.8,
        sortable: false,
        renderCell: (params) =>
          renderDiffValue(
            params.row.matchedBoard?.longitude ?? null,
            params.row.longitude ?? null,
            Boolean(
              params.row.diff?.location ||
                (!params.row.matchedBoard && params.row.longitude !== null)
            ),
            {
              variant: "caption",
              formatter: formatLatLngValue,
            }
          ),
      },
      {
        field: "distanceMeter",
        headerName: "距離(m)",
        flex: 0.6,
        align: "right",
        headerAlign: "right",
        sortable: false,
        renderCell: (params) => (
          <Typography variant="caption">
            {params.row.distanceMeter !== null
              ? params.row.distanceMeter.toFixed(1)
              : "-"}
          </Typography>
        ),
      },
      {
        field: "decision",
        headerName: "決定",
        flex: 0.9,
        minWidth: 160,
        sortable: false,
        renderCell: (params: GridRenderCellParams<BoardImportRowDTO>) => {
          const isRowPending = pendingRowIds.has(params.row.id) && isPending;
          return (
            <Select
              size="small"
              value={decisionToSelectValue(params.row.finalDecision)}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) =>
                handleDecisionChange(
                  params.row,
                  selectValueToDecision(event.target.value as string)
                )
              }
              disabled={isRowPending}
              displayEmpty
              fullWidth
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
          );
        },
      },
      {
        field: "comment",
        headerName: "コメント",
        flex: 0.6,
        sortable: false,
        renderCell: (params: GridRenderCellParams<BoardImportRowDTO>) => (
          <Button
            size="small"
            variant={params.row.comment ? "outlined" : "text"}
            onClick={(event) => {
              event.stopPropagation();
              handleOpenCommentDialog(params.row as BoardImportRowDTO);
            }}
          >
            {params.row.comment ? "編集" : "追加"}
          </Button>
        ),
      },
    ],
    [handleDecisionChange, handleOpenCommentDialog, isPending, pendingRowIds]
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          flex: 1,
          minHeight: 0,
          height: "100%",
          overflow: "hidden",
          display: "flex",
        }}
      >
        <DataGrid
          rows={items}
          columns={columns}
          getRowId={(row) => row.id}
          onRowClick={(params) =>
            handleRowSelect(params.row as BoardImportRowDTO)
          }
          disableColumnMenu
          disableColumnFilter
          disableColumnSelector
          hideFooter
          density="standard"
          getRowClassName={(params) =>
            params.id === activeSelectedId ? "selected-row" : ""
          }
          sx={{
            flex: 1,
            border: "none",
            "& .MuiDataGrid-cell": {
              alignItems: "center",
            },
            "& .selected-row": {
              backgroundColor: (theme) => theme.palette.action.selected,
            },
          }}
          disableRowSelectionOnClick
        />
      </Paper>
      <Dialog
        open={Boolean(commentDialogRow)}
        onClose={handleCloseCommentDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>コメント編集</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            minRows={3}
            fullWidth
            value={commentDraft}
            onChange={(event) => setCommentDraft(event.target.value)}
            placeholder="コメントを入力"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCommentDialog}>キャンセル</Button>
          <Button onClick={handleSaveComment} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
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
    </Box>
  );
}
