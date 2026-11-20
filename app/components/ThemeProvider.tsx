"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  THEME_STORAGE_KEY,
  parseThemeMode,
  resolveThemeMode,
  type ResolvedTheme,
  type ThemeMode,
} from "../lib/themePreference";

export type { ThemeMode, ResolvedTheme };

type ThemeContextValue = {
  theme: ThemeMode;
  resolved: ResolvedTheme;
  mounted: boolean;
  setTheme: (mode: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyResolvedTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let initial: ThemeMode = "system";
    try {
      initial = parseThemeMode(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      initial = "system";
    }
    const nextResolved = resolveThemeMode(initial, getSystemPrefersDark());
    setThemeState(initial);
    setResolved(nextResolved);
    applyResolvedTheme(nextResolved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const nextResolved = resolveThemeMode(theme, getSystemPrefersDark());
    applyResolvedTheme(nextResolved);
    setResolved(nextResolved);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted || theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const nextResolved = resolveThemeMode("system", mq.matches);
      applyResolvedTheme(nextResolved);
      setResolved(nextResolved);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, mounted]);

  const setTheme = (mode: ThemeMode) => {
    const valid = parseThemeMode(mode);
    setThemeState(valid);
    const nextResolved = resolveThemeMode(valid, getSystemPrefersDark());
    applyResolvedTheme(nextResolved);
    setResolved(nextResolved);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, valid);
    } catch {}
  };

  const toggle = () => {
    const current = resolveThemeMode(theme, getSystemPrefersDark());
    setTheme(current === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, resolved, mounted, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "system" as ThemeMode,
      resolved: "dark" as ResolvedTheme,
      mounted: false,
      setTheme: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}
