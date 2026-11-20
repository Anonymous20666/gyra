import test from "node:test";
import assert from "node:assert/strict";
import {
  THEME_MODES,
  THEME_STORAGE_KEY,
  nextThemeMode,
  parseThemeMode,
  resolveThemeMode,
} from "./themePreference";

test("THEME_STORAGE_KEY and THEME_MODES expose all three modes", () => {
  assert.equal(THEME_STORAGE_KEY, "gyra:theme");
  assert.deepEqual([...THEME_MODES], ["light", "dark", "system"]);
});

test("parseThemeMode safely validates stored strings and defaults to system", () => {
  assert.equal(parseThemeMode("light"), "light");
  assert.equal(parseThemeMode("dark"), "dark");
  assert.equal(parseThemeMode("system"), "system");
  assert.equal(parseThemeMode(""), "system");
  assert.equal(parseThemeMode("invalid"), "system");
  assert.equal(parseThemeMode(null), "system");
  assert.equal(parseThemeMode(undefined), "system");
});

test("resolveThemeMode honors explicit overrides and falls back to OS preference for system", () => {
  assert.equal(resolveThemeMode("light", true), "light");
  assert.equal(resolveThemeMode("dark", false), "dark");
  assert.equal(resolveThemeMode("system", true), "dark");
  assert.equal(resolveThemeMode("system", false), "light");
});

test("nextThemeMode cycles deterministically light -> dark -> system -> light", () => {
  assert.equal(nextThemeMode("light"), "dark");
  assert.equal(nextThemeMode("dark"), "system");
  assert.equal(nextThemeMode("system"), "light");
});
