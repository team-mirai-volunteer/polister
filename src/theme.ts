"use client";

import { createTheme } from "@mui/material/styles";

const primaryMain = "#2AA693";
const primaryLight = "#5BC6AD";
const primaryDark = "#1F7F6F";
const accentRed = "#E40014";
const backgroundBase = "#F7F4F0";
const bodyBackground = "#EEEEEE";
const textPrimary = "#1D293D";
const textSecondary = "#45556C";

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: primaryMain,
      light: primaryLight,
      dark: primaryDark,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: accentRed,
      light: "#FF6B7D",
      dark: "#BF0010",
      contrastText: "#FFFFFF",
    },
    background: {
      default: backgroundBase,
      paper: "#FFFFFF",
    },
    text: {
      primary: textPrimary,
      secondary: textSecondary,
      disabled: "rgba(69, 85, 108, 0.4)",
    },
    grey: {
      100: "#F2F2F2",
      200: "#E6E7EA",
      300: "#CBD3DD",
      500: "#9AA3B3",
      700: "#5E6A7D",
      900: textPrimary,
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "var(--font-noto-sans-jp)",
    fontSize: 16,
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      lineHeight: 1.25,
      color: textPrimary,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 700,
      letterSpacing: "-0.015em",
      lineHeight: 1.3,
      color: textPrimary,
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 700,
      letterSpacing: "-0.01em",
      lineHeight: 1.35,
      color: textPrimary,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 700,
      lineHeight: 1.35,
      color: textPrimary,
    },
    h5: {
      fontSize: "1.375rem",
      fontWeight: 600,
      lineHeight: 1.4,
      color: textPrimary,
    },
    h6: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.45,
      color: textPrimary,
    },
    subtitle1: {
      fontWeight: 600,
      fontSize: "1.125rem",
      letterSpacing: "0.01em",
      color: textSecondary,
    },
    subtitle2: {
      fontWeight: 600,
      fontSize: "0.95rem",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      color: textSecondary,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.75,
      color: textSecondary,
    },
    body2: {
      fontSize: "0.95rem",
      lineHeight: 1.6,
      color: textSecondary,
    },
    button: {
      fontSize: "1rem",
      fontWeight: 600,
      letterSpacing: "0.025em",
      textTransform: "none",
    },
    overline: {
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: textSecondary,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: `linear-gradient(180deg, ${bodyBackground} 0%, ${backgroundBase} 60%)`,
          color: textPrimary,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          color: textPrimary,
          boxShadow: "0 6px 18px rgba(29, 41, 61, 0.08)",
          backdropFilter: "blur(6px)",
          borderRadius: 0,
          width: "100%",
          margin: 0,
          paddingInline: 0,
        },
      },
      defaultProps: {
        elevation: 0,
        color: "inherit",
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 72,
          paddingInline: 16,
          "@media (min-width:600px)": {
            minHeight: 80,
            paddingInline: 24,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 10,
          paddingBottom: 10,
          boxShadow: "none",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          fontWeight: 600,
          "&:hover": {
            transform: "translateY(-1px)",
          },
        },
        containedPrimary: {
          backgroundImage: `linear-gradient(135deg, ${primaryMain} 0%, ${primaryLight} 100%)`,
          boxShadow: "0 16px 32px rgba(42, 166, 147, 0.22)",
          color: "#FFFFFF",
          "&:hover": {
            backgroundImage: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryMain} 100%)`,
            boxShadow: "0 18px 38px rgba(42, 166, 147, 0.28)",
          },
        },
        outlined: {
          borderColor: "rgba(29, 41, 61, 0.18)",
          color: textPrimary,
          backgroundColor: "rgba(255, 255, 255, 0.6)",
          "&:hover": {
            borderColor: primaryMain,
            color: primaryMain,
            backgroundColor: "rgba(42, 166, 147, 0.08)",
          },
        },
        text: {
          color: textPrimary,
          "&:hover": {
            backgroundColor: "rgba(42, 166, 147, 0.06)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundImage: "none",
        },
      },
      defaultProps: {
        elevation: 0,
      },
      variants: [
        {
          props: { variant: "outlined" },
          style: {
            padding: "24px",
            border: "1px solid rgba(29, 41, 61, 0.12)",
            backgroundColor: "#FFFFFF",
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: "0 18px 32px rgba(29, 41, 61, 0.08)",
          padding: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          letterSpacing: "0.04em",
        },
        colorSecondary: {
          backgroundColor: "rgba(228, 0, 20, 0.12)",
          color: accentRed,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: "rgba(29, 41, 61, 0.04)",
          color: textSecondary,
          transition: "all 0.22s ease",
          "&:hover": {
            backgroundColor: "rgba(42, 166, 147, 0.16)",
            color: primaryMain,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        flexContainer: {
          gap: 4,
        },
        indicator: {
          display: "flex",
          justifyContent: "center",
          backgroundColor: "transparent",
          "&::after": {
            content: '""',
            width: "60%",
            height: 3,
            borderRadius: 3,
            backgroundColor: primaryMain,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 10,
          fontWeight: 600,
          letterSpacing: "0.02em",
          minHeight: 48,
          paddingInline: 18,
          color: textSecondary,
          "&.Mui-selected": {
            color: primaryMain,
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: "1px solid rgba(29, 41, 61, 0.1)",
          textTransform: "none",
          fontWeight: 600,
          letterSpacing: "0.02em",
          color: textSecondary,
          "&.Mui-selected": {
            backgroundColor: "rgba(42, 166, 147, 0.14)",
            borderColor: "rgba(42, 166, 147, 0.42)",
            color: primaryDark,
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 52,
          height: 32,
          padding: 0,
        },
        switchBase: {
          top: 3,
          left: 3,
          "&.Mui-checked": {
            transform: "translateX(20px)",
            color: "#fff",
            "& + .MuiSwitch-track": {
              backgroundColor: primaryMain,
              opacity: 1,
            },
          },
        },
        thumb: {
          width: 24,
          height: 24,
          boxShadow: "0 6px 14px rgba(29, 41, 61, 0.18)",
        },
        track: {
          borderRadius: 32,
          backgroundColor: "rgba(29, 41, 61, 0.18)",
          opacity: 1,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          padding: "10px 14px",
          backgroundColor: "rgba(29, 41, 61, 0.92)",
          fontSize: "0.85rem",
          letterSpacing: "0.015em",
        },
        arrow: {
          color: "rgba(29, 41, 61, 0.92)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          letterSpacing: "0.01em",
          "&:hover": {
            backgroundColor: "rgba(42, 166, 147, 0.12)",
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 16,
          "&.Mui-selected": {
            backgroundColor: "rgba(42, 166, 147, 0.18)",
            color: primaryDark,
            "&:hover": {
              backgroundColor: "rgba(42, 166, 147, 0.24)",
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(29, 41, 61, 0.12)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: primaryMain,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: primaryMain,
            boxShadow: "0 0 0 3px rgba(42, 166, 147, 0.12)",
          },
        },
        input: {
          padding: "14px 18px",
          fontWeight: 500,
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 16,
          paddingRight: 16,
          "@media (min-width:600px)": {
            paddingLeft: 28,
            paddingRight: 28,
          },
          "@media (min-width:900px)": {
            paddingLeft: 32,
            paddingRight: 32,
          },
        },
      },
    },
  },
});

export default theme;
