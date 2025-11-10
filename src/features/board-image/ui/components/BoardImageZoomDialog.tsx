"use client";

import CloseIcon from "@mui/icons-material/Close";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useMemo, useRef, useState } from "react";

interface BoardImageZoomDialogProps {
  imageUrl: string;
  imageName: string;
  open: boolean;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 0.25;

export function BoardImageZoomDialog({
  imageUrl,
  imageName,
  open,
  onClose,
}: BoardImageZoomDialogProps) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const [dragging, setDragging] = useState(false);

  const resetView = useCallback(() => {
    setScale(1);
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant" as ScrollBehavior,
      });
    }
  }, []);

  const handleZoomIn = () =>
    setScale((prev) => Math.min(prev + SCALE_STEP, MAX_SCALE));
  const handleZoomOut = () =>
    setScale((prev) => Math.max(prev - SCALE_STEP, MIN_SCALE));

  const beginDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (scale <= 1 || !containerRef.current) {
        return;
      }
      containerRef.current.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: containerRef.current.scrollLeft,
        scrollTop: containerRef.current.scrollTop,
      };
      setDragging(true);
    },
    [scale]
  );

  const moveDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (
        !dragging ||
        !containerRef.current ||
        dragRef.current.pointerId !== event.pointerId
      ) {
        return;
      }
      event.preventDefault();
      const dx = event.clientX - dragRef.current.startX;
      const dy = event.clientY - dragRef.current.startY;
      containerRef.current.scrollLeft = dragRef.current.scrollLeft - dx;
      containerRef.current.scrollTop = dragRef.current.scrollTop - dy;
    },
    [dragging]
  );

  const endDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (containerRef.current && dragRef.current.pointerId === event.pointerId) {
      containerRef.current.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  }, []);

  const hint = useMemo(() => {
    if (scale <= 1) {
      return "＋ボタンで拡大できます";
    }
    if (scale >= MAX_SCALE) {
      return "最大まで拡大しました";
    }
    return "ドラッグで画像を移動できます";
  }, [scale]);

  const handleClose = () => {
    resetView();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { bgcolor: "black", color: "common.white" },
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-end"
        alignItems="center"
        sx={{ p: 1 }}
      >
        <Typography variant="subtitle2" sx={{ flexGrow: 1, textAlign: "left" }}>
          {imageName}
        </Typography>
        <Tooltip title="縮小">
          <Box>
            <IconButton
              onClick={handleZoomOut}
              disabled={scale <= MIN_SCALE}
              color="inherit"
              size="small"
            >
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Box>
        </Tooltip>
        <Tooltip title="リセット">
          <Box>
            <IconButton
              onClick={resetView}
              disabled={scale === 1}
              color="inherit"
              size="small"
            >
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Box>
        </Tooltip>
        <Tooltip title="拡大">
          <Box>
            <IconButton
              onClick={handleZoomIn}
              disabled={scale >= MAX_SCALE}
              color="inherit"
              size="small"
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Box>
        </Tooltip>
        <IconButton onClick={handleClose} color="inherit" size="small">
          <CloseIcon />
        </IconButton>
      </Stack>
      <DialogContent
        sx={{
          p: 0,
          bgcolor: "black",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box
          ref={containerRef}
          sx={{
            width: "100%",
            maxHeight: "80vh",
            overflow: "auto",
            cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "default",
          }}
          onPointerDown={beginDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        >
          <Box
            component="img"
            src={imageUrl}
            alt={imageName}
            sx={{
              width: `${scale * 100}%`,
              maxWidth: "none",
              height: "auto",
              userSelect: "none",
              pointerEvents: "none",
              display: "block",
            }}
          />
        </Box>
      </DialogContent>
      <Typography variant="caption" sx={{ textAlign: "center", py: 1 }}>
        {hint}
      </Typography>
    </Dialog>
  );
}
