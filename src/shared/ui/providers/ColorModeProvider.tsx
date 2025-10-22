"use client";

import { CssBaseline, ThemeProvider, type PaletteMode } from "@mui/material";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { createAppTheme } from "@/theme";

interface ColorModeContextValue {
  mode: PaletteMode;
  setMode: Dispatch<SetStateAction<PaletteMode>>;
  toggleMode: () => void;
}

const STORAGE_KEY = "polister-color-mode";

const ColorModeContext = createContext<ColorModeContextValue | undefined>(
  undefined
);

const resolveInitialMode = (): PaletteMode => {
  if (typeof window === "undefined") {
    return "light";
  }

  let stored: PaletteMode | null = null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY) as PaletteMode | null;
  } catch {
    stored = null;
  }

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  if (typeof window.matchMedia !== "function") {
    return "light";
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(() => resolveInitialMode());
  const [isMounted, setIsMounted] = useState(false);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextMode = resolveInitialMode();
    setMode(nextMode);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const listener = (event: MediaQueryListEvent) => {
      const preferred = event.matches ? "dark" : "light";
      setMode(preferred);
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", listener);
      return () => {
        mediaQuery.removeEventListener("change", listener);
      };
    }

    mediaQuery.addListener(listener);
    return () => {
      mediaQuery.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Safari プライベートモード等では storage が無効化されている場合があるため、例外は握りつぶす
    }
  }, [mode, isMounted]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo<ColorModeContextValue>(
    () => ({
      mode,
      setMode,
      toggleMode,
    }),
    [mode, toggleMode]
  );

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export const useColorMode = (): ColorModeContextValue => {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error(
      "useColorMode は ColorModeProvider の内部で使用してください。"
    );
  }
  return context;
};
