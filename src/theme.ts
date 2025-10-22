"use client";

import type { PaletteMode, ThemeOptions } from "@mui/material";
import { createTheme } from "@mui/material/styles";

const primaryMain = "#2AA693";
const primaryLight = "#5BC6AD";
const primaryDark = "#1F7F6F";
const accentRed = "#E40014";

const surfaceTokens = {
  light: {
    backgroundDefault: "#F7F4F0",
    backgroundPaper: "#FFFFFF",
    bodyGradientStart: "#EEEEEE",
    bodyGradientEnd: "#F7F4F0",
    textPrimary: "#1D293D",
    textSecondary: "#45556C",
    appBarBackground: "rgba(255, 255, 255, 0.96)",
    appBarShadow: "0 6px 18px rgba(29, 41, 61, 0.08)",
    outlineBorder: "rgba(29, 41, 61, 0.12)",
    buttonOutlinedBg: "rgba(255, 255, 255, 0.6)",
    iconButtonBg: "rgba(29, 41, 61, 0.04)",
    iconButtonHoverBg: "rgba(42, 166, 147, 0.16)",
    iconButtonHoverColor: primaryMain,
    switchTrack: "rgba(29, 41, 61, 0.18)",
    toggleSelectedBg: "rgba(42, 166, 147, 0.14)",
    toggleSelectedBorder: "rgba(42, 166, 147, 0.42)",
    tooltipBg: "rgba(29, 41, 61, 0.92)",
    tooltipText: "#FFFFFF",
    containerPadding: {
      sm: 28,
      md: 32,
    },
  },
  dark: {
    backgroundDefault: "#0F172A",
    backgroundPaper: "#16223B",
    bodyGradientStart: "#0B1120",
    bodyGradientEnd: "#0F172A",
    textPrimary: "#E2E8F0",
    textSecondary: "#A3B4D3",
    appBarBackground: "rgba(15, 23, 42, 0.9)",
    appBarShadow: "0 6px 18px rgba(8, 15, 27, 0.6)",
    outlineBorder: "rgba(148, 163, 184, 0.3)",
    buttonOutlinedBg: "rgba(148, 163, 184, 0.14)",
    iconButtonBg: "rgba(148, 163, 184, 0.1)",
    iconButtonHoverBg: "rgba(42, 166, 147, 0.3)",
    iconButtonHoverColor: "#7EEADF",
    switchTrack: "rgba(148, 163, 184, 0.3)",
    toggleSelectedBg: "rgba(42, 166, 147, 0.32)",
    toggleSelectedBorder: "rgba(42, 166, 147, 0.64)",
    tooltipBg: "rgba(12, 19, 35, 0.92)",
    tooltipText: "#E2E8F0",
    containerPadding: {
      sm: 24,
      md: 28,
    },
  },
} as const;

const buildPalette = (mode: PaletteMode): ThemeOptions["palette"] => {
  const surface = surfaceTokens[mode];

  return {
    mode,
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
      default: surface.backgroundDefault,
      paper: surface.backgroundPaper,
    },
    text: {
      primary: surface.textPrimary,
      secondary: surface.textSecondary,
      disabled:
        mode === "dark" ? "rgba(148, 163, 184, 0.4)" : "rgba(69, 85, 108, 0.4)",
    },
    grey:
      mode === "dark"
        ? {
            100: "#1F2B3C",
            200: "#223248",
            300: "#314364",
            500: "#5E7396",
            700: "#94A3B8",
            900: surface.textPrimary,
          }
        : {
            100: "#F2F2F2",
            200: "#E6E7EA",
            300: "#CBD3DD",
            500: "#9AA3B3",
            700: "#5E6A7D",
            900: surface.textPrimary,
          },
  };
};

const baseTypography: ThemeOptions["typography"] = {
  fontFamily: "var(--font-noto-sans-jp)",
  fontSize: 16,
  h1: {
    fontSize: "2.5rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 1.25,
  },
  h2: {
    fontSize: "2rem",
    fontWeight: 700,
    letterSpacing: "-0.015em",
    lineHeight: 1.3,
  },
  h3: {
    fontSize: "1.75rem",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    lineHeight: 1.35,
  },
  h4: {
    fontSize: "1.5rem",
    fontWeight: 700,
    lineHeight: 1.35,
  },
  h5: {
    fontSize: "1.375rem",
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h6: {
    fontSize: "1.125rem",
    fontWeight: 600,
    lineHeight: 1.45,
  },
  subtitle1: {
    fontWeight: 600,
    fontSize: "1.125rem",
    letterSpacing: "0.01em",
  },
  subtitle2: {
    fontWeight: 600,
    fontSize: "0.95rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  body1: {
    fontSize: "1rem",
    lineHeight: 1.75,
  },
  body2: {
    fontSize: "0.95rem",
    lineHeight: 1.6,
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
  },
};

const baseShape: ThemeOptions["shape"] = {
  borderRadius: 8,
};

const buildComponents = (mode: PaletteMode): ThemeOptions["components"] => {
  const surface = surfaceTokens[mode];

  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: `linear-gradient(180deg, ${surface.bodyGradientStart} 0%, ${surface.bodyGradientEnd} 60%)`,
          color: surface.textPrimary,
          transition: "background 0.3s ease",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: surface.appBarBackground,
          color: surface.textPrimary,
          boxShadow: surface.appBarShadow,
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
          boxShadow:
            mode === "dark"
              ? "0 16px 32px rgba(34, 211, 185, 0.35)"
              : "0 16px 32px rgba(42, 166, 147, 0.22)",
          color: "#FFFFFF",
          "&:hover": {
            backgroundImage: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryMain} 100%)`,
            boxShadow:
              mode === "dark"
                ? "0 18px 38px rgba(34, 211, 185, 0.42)"
                : "0 18px 38px rgba(42, 166, 147, 0.28)",
          },
        },
        outlined: {
          borderColor: surface.outlineBorder,
          color: surface.textPrimary,
          backgroundColor: surface.buttonOutlinedBg,
          "&:hover": {
            borderColor: primaryMain,
            color: primaryMain,
            backgroundColor:
              mode === "dark"
                ? "rgba(42, 166, 147, 0.24)"
                : "rgba(42, 166, 147, 0.08)",
          },
        },
        text: {
          color: surface.textPrimary,
          "&:hover": {
            backgroundColor:
              mode === "dark"
                ? "rgba(148, 163, 184, 0.12)"
                : "rgba(42, 166, 147, 0.06)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundImage: "none",
          backgroundColor: surface.backgroundPaper,
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
            border: `1px solid ${surface.outlineBorder}`,
            backgroundColor: surface.backgroundPaper,
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow:
            mode === "dark"
              ? "0 18px 32px rgba(8, 15, 27, 0.5)"
              : "0 18px 32px rgba(29, 41, 61, 0.08)",
          padding: 8,
          backgroundColor: surface.backgroundPaper,
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
          backgroundColor:
            mode === "dark"
              ? "rgba(228, 0, 20, 0.32)"
              : "rgba(228, 0, 20, 0.12)",
          color: accentRed,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: surface.iconButtonBg,
          color: surface.textSecondary,
          transition: "all 0.22s ease",
          "&:hover": {
            backgroundColor: surface.iconButtonHoverBg,
            color: surface.iconButtonHoverColor,
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
          color: surface.textSecondary,
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
          border: `1px solid ${surface.outlineBorder}`,
          textTransform: "none",
          fontWeight: 600,
          letterSpacing: "0.02em",
          color: surface.textSecondary,
          "&.Mui-selected": {
            backgroundColor: surface.toggleSelectedBg,
            borderColor: surface.toggleSelectedBorder,
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
          boxShadow:
            mode === "dark"
              ? "0 6px 14px rgba(8, 15, 27, 0.6)"
              : "0 6px 14px rgba(29, 41, 61, 0.18)",
        },
        track: {
          borderRadius: 32,
          backgroundColor: surface.switchTrack,
          opacity: 1,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          padding: "10px 14px",
          backgroundColor: surface.tooltipBg,
          fontSize: "0.85rem",
          letterSpacing: "0.015em",
          color: surface.tooltipText,
        },
        arrow: {
          color: surface.tooltipBg,
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
            backgroundColor:
              mode === "dark"
                ? "rgba(42, 166, 147, 0.22)"
                : "rgba(42, 166, 147, 0.12)",
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
            backgroundColor:
              mode === "dark"
                ? "rgba(42, 166, 147, 0.32)"
                : "rgba(42, 166, 147, 0.18)",
            color: primaryDark,
            "&:hover": {
              backgroundColor:
                mode === "dark"
                  ? "rgba(42, 166, 147, 0.4)"
                  : "rgba(42, 166, 147, 0.24)",
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor:
            mode === "dark"
              ? "rgba(15, 23, 42, 0.6)"
              : "rgba(255, 255, 255, 0.7)",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: surface.outlineBorder,
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
            paddingLeft: surface.containerPadding.sm,
            paddingRight: surface.containerPadding.sm,
          },
          "@media (min-width:900px)": {
            paddingLeft: surface.containerPadding.md,
            paddingRight: surface.containerPadding.md,
          },
        },
      },
    },
  };
};

export const createAppTheme = (mode: PaletteMode) =>
  createTheme({
    cssVariables: true,
    palette: buildPalette(mode),
    shape: baseShape,
    typography: {
      ...baseTypography,
      h1: { ...baseTypography.h1, color: surfaceTokens[mode].textPrimary },
      h2: { ...baseTypography.h2, color: surfaceTokens[mode].textPrimary },
      h3: { ...baseTypography.h3, color: surfaceTokens[mode].textPrimary },
      h4: { ...baseTypography.h4, color: surfaceTokens[mode].textPrimary },
      h5: { ...baseTypography.h5, color: surfaceTokens[mode].textPrimary },
      h6: { ...baseTypography.h6, color: surfaceTokens[mode].textPrimary },
      subtitle1: {
        ...baseTypography.subtitle1,
        color: surfaceTokens[mode].textSecondary,
      },
      subtitle2: {
        ...baseTypography.subtitle2,
        color: surfaceTokens[mode].textSecondary,
      },
      body1: {
        ...baseTypography.body1,
        color: surfaceTokens[mode].textSecondary,
      },
      body2: {
        ...baseTypography.body2,
        color: surfaceTokens[mode].textSecondary,
      },
      overline: {
        ...baseTypography.overline,
        color: surfaceTokens[mode].textSecondary,
      },
    },
    components: buildComponents(mode),
  });

const theme = createAppTheme("light");
export default theme;
