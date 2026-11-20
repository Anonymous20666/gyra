export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "gyra:theme";
export const THEME_MODES: readonly ThemeMode[] = ["light", "dark", "system"] as const;

export function parseThemeMode(raw: string | null | undefined): ThemeMode {
  if (raw === "light" || raw === "dark" || raw === "system") {
    return raw;
  }
  return "system";
}

export function resolveThemeMode(
  mode: ThemeMode,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (mode === "light" || mode === "dark") return mode;
  return systemPrefersDark ? "dark" : "light";
}

export function nextThemeMode(current: ThemeMode): ThemeMode {
  const idx = THEME_MODES.indexOf(current);
  return THEME_MODES[(idx + 1) % THEME_MODES.length];
}
