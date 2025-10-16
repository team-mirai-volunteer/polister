"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: true,
  typography: {
    fontFamily: "var(--font-noto-sans-jp)",
    fontSize: 16,
    h1: {
      fontSize: "2rem",
      fontWeight: 700,
    },
    h2: {
      fontSize: "1.25rem", // 20px
      fontWeight: 700,
    },
    h3: {
      fontSize: "1.5rem", // 24px
      fontWeight: 700,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 700,
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 700,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 700,
    },
    body1: {
      fontSize: "1rem", // 16px
    },
    body2: {
      fontSize: "0.875rem", // 14px
    },
    button: {
      fontSize: "1rem", // 16px
      fontWeight: 400,
      textTransform: "none",
    },
  },
  palette: {
    mode: "light",
    primary: {
      main: "#64d8c6", // ティールグリーン（グラデーション開始色）
      light: "#bcecd3", // グラデーション終了色
      dark: "#0f8472", // ダークティール
      contrastText: "#000000",
    },
    secondary: {
      main: "#1f2937", // ダークグレー
      light: "#404040",
      dark: "#000000",
      contrastText: "#ffffff",
    },
    background: {
      default: "#eeeeee", // 明るいグレー
      paper: "#ffffff",
    },
    text: {
      primary: "#000000",
      secondary: "#4c4c4c",
      disabled: "#c7c7cc",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          paddingLeft: 24,
          paddingRight: 24,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;
