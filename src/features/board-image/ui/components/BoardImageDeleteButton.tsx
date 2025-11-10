"use client";

import { deleteBoardImageAction } from "@/features/board-image/application/actions/deleteBoardImageAction";
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
  Stack,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface BoardImageDeleteButtonProps {
  imageId: string;
}

export function BoardImageDeleteButton({
  imageId,
}: BoardImageDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteBoardImageAction(imageId);
      if (result.success) {
        setOpen(false);
        setSnackbar({ open: true, message: "写真を削除しました" });
        router.push("/board-images");
        router.refresh();
      } else {
        setSnackbar({ open: true, message: "写真の削除に失敗しました" });
      }
    });
  };

  return (
    <>
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteOutlineIcon />}
          onClick={() => setOpen(true)}
          disabled={pending}
        >
          写真を削除
        </Button>
      </Stack>

      <Dialog open={open} onClose={() => !pending && setOpen(false)}>
        <DialogTitle>写真を削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            削除すると元に戻せません。この写真に紐付く情報も失われます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={pending}>
            キャンセル
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            startIcon={<DeleteOutlineIcon />}
            disabled={pending}
          >
            削除する
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ open: false, message: "" })}
      >
        <Alert
          severity={snackbar.message.includes("失敗") ? "error" : "success"}
          onClose={() => setSnackbar({ open: false, message: "" })}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
