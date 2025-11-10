"use client";

import { deleteBoardImportBatchAction } from "@/features/board-import/application/actions/deleteBoardImportBatchAction";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface BoardImportDeleteButtonProps {
  batchId: string;
}

export function BoardImportDeleteButton({ batchId }: BoardImportDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteBoardImportBatchAction({ batchId });
      if (result.success) {
        setSnackbar({ open: true, message: "インポートバッチを削除しました", severity: "success" });
        setOpen(false);
        router.push("/board-imports");
        router.refresh();
      } else if (result.error === "not_found") {
        setSnackbar({ open: true, message: "バッチが見つかりませんでした", severity: "error" });
      } else {
        setSnackbar({ open: true, message: "削除に失敗しました", severity: "error" });
      }
    });
  };

  return (
    <>
      <Button
        variant="contained"
        color="error"
        startIcon={<DeleteOutlineIcon />}
        onClick={() => setOpen(true)}
        size="small"
      >
        バッチを削除
      </Button>

      <Dialog open={open} onClose={() => !isPending && setOpen(false)}>
        <DialogTitle>バッチを削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            この操作は取り消せません。関連するレビュー行や欠落データもすべて削除されます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={isPending}>
            キャンセル
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            startIcon={<DeleteOutlineIcon />}
            disabled={isPending}
          >
            削除する
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
