"use client";

import DarkModeIcon from "@mui/icons-material/DarkModeRounded";
import LightModeIcon from "@mui/icons-material/LightModeRounded";
import { IconButton, Tooltip } from "@mui/material";

import { useColorMode } from "@/shared/ui/providers/ColorModeProvider";

export function ColorModeToggle() {
  const { mode, toggleMode } = useColorMode();

  const isDark = mode === "dark";

  return (
    <Tooltip
      title={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
    >
      <IconButton
        size="small"
        color="inherit"
        onClick={toggleMode}
        aria-label={
          isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"
        }
      >
        {isDark ? (
          <LightModeIcon fontSize="small" />
        ) : (
          <DarkModeIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}
