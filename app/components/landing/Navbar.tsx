"use client";

import { useEffect, useState } from "react";
import { Menu, Monitor, Moon, Sun, X } from "lucide-react";
import { resolveGyraRoute } from "../../lib/landingSimulations";
import { useTheme, type ThemeMode } from "../ThemeProvider";
import { GyraLogoMark } from "./GyraLogoMark";

export interface NavbarProps {
  isAuthenticated?: boolean;
  routeBase?: string;
}

const NAV_ITEMS = [
  { label: "Playground", href: "/playground" },
  { label: "Models", href: "/models" },
  { label: "Platform", href: "#architecture" },
  { label: "API", href: "/api" },
] as const;

const THEME_OPTIONS: readonly {
  mode: ThemeMode;
  label: string;
  Icon: typeof Sun;
}[] = [
  { mode: "light", label: "Light", Icon: Sun },
  { mode: "dark", label: "Dark", Icon: Moon },
  { mode: "system", label: "System", Icon: Monitor },
] as const;

export function Navbar({ isAuthenticated = false, routeBase = "" }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, mounted, setTheme } = useTheme();

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const primaryHref = resolveGyraRoute("/workspace", routeBase);
  const loginHref = resolveGyraRoute("/login", routeBase);
  const docsHref = resolveGyraRoute("/docs", routeBase);

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-[#DCE4EC] bg-white/95 backdrop-blur-md transition-colors duration-200 dark:border-[#1F1F1F] dark:bg-black/95">
      <div className="mx-auto flex h-full max-w-[1380px] items-center justify-between gap-6 px-5 sm:px-8">
        {/* Zone 1: Brand mark */}
        <a
          href={resolveGyraRoute("/", routeBase)}
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1F5B7C] dark:focus-visible:ring-[#5B9EC2]"
          aria-label="Gyra Home"
        >
          <GyraLogoMark size={40} />
          <span className="font-display text-[22px] font-bold tracking-[0.07em] text-[#0B1218] uppercase dark:text-white">
            Gyra
          </span>
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="font-mono-tech relative shrink-0 whitespace-nowrap py-1 text-[11.5px] tracking-[0.11em] text-[#526373] uppercase transition-colors duration-150 hover:text-[#0B1218] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[1px] after:origin-left after:scale-x-0 after:bg-[#1B587A] after:transition-transform after:duration-200 hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1F5B7C] dark:text-[#98A4AE] dark:hover:text-white dark:after:bg-[#5B9EC2] dark:focus-visible:ring-[#5B9EC2]"
            >
              {item.label}
            </a>
          ))}
          <a
            href={docsHref}
            className="font-mono-tech relative shrink-0 whitespace-nowrap py-1 text-[11.5px] tracking-[0.11em] text-[#526373] uppercase transition-colors duration-150 hover:text-[#0B1218] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[1px] after:origin-left after:scale-x-0 after:bg-[#1B587A] after:transition-transform after:duration-200 hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1F5B7C] dark:text-[#98A4AE] dark:hover:text-white dark:after:bg-[#5B9EC2] dark:focus-visible:ring-[#5B9EC2]"
          >
            Docs
          </a>
        </nav>

        {/* Zone 3: Precision Theme Switcher + Action Zone */}
        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <div
            role="radiogroup"
            aria-label="Color theme"
            className="inline-flex items-center border border-[#D4DEE8] bg-[#EEF3F7] p-0.5 dark:border-[#242D36] dark:bg-[#090D12]"
          >
            {THEME_OPTIONS.map(({ mode, label, Icon }) => {
              const active = mounted ? theme === mode : mode === "system";
              return (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={`${label} theme`}
                  title={`${label} theme`}
                  onClick={() => setTheme(mode)}
                  className={`inline-flex h-7 w-7 items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1F5B7C] dark:focus-visible:ring-[#5B9EC2] ${
                    active
                      ? "bg-white text-[#0B1218] shadow-[0_1px_2px_rgba(11,18,24,0.1)] dark:bg-[#142535] dark:text-[#9CC4DC] dark:shadow-none"
                      : "text-[#637484] hover:text-[#0B1218] dark:text-[#718292] dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              );
            })}
          </div>

          {!isAuthenticated && (
            <a
              href={loginHref}
              className="font-mono-tech shrink-0 whitespace-nowrap px-3 py-2 text-[12px] tracking-[0.08em] text-[#465666] uppercase transition-colors duration-150 hover:text-[#0B1218] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1F5B7C] dark:text-[#CCCCCC] dark:hover:text-white dark:focus-visible:ring-[#5B9EC2]"
            >
              Sign in
            </a>
          )}
          <a
            href={primaryHref}
            className="font-mono-tech inline-flex shrink-0 items-center justify-center whitespace-nowrap bg-[#0B1218] px-4 py-2 text-[12px] font-medium tracking-[0.08em] text-white uppercase transition-colors duration-150 hover:bg-[#1B587A] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1F5B7C] dark:bg-white dark:text-black dark:hover:bg-[#E5E5E5] dark:focus-visible:ring-[#5B9EC2]"
          >
            {isAuthenticated ? "Workspace" : "Open Gyra"}
          </a>
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="gyra-mobile-nav"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          className="inline-flex h-10 w-10 items-center justify-center border border-[#D4DEE8] bg-white text-[#0B1218] transition-colors hover:border-[#1B587A] lg:hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1F5B7C] dark:border-[#262626] dark:bg-black dark:text-white dark:hover:border-[#444] dark:focus-visible:ring-[#5B9EC2]"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          id="gyra-mobile-nav"
          className="border-b border-[#DCE4EC] bg-white px-5 pb-6 pt-4 lg:hidden dark:border-[#1F1F1F] dark:bg-black"
        >
          <nav aria-label="Mobile" className="flex flex-col border-t border-[#E6ECF2] dark:border-[#1F1F1F]">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="font-mono-tech border-b border-[#EDF2F7] py-3.5 text-[12px] tracking-[0.12em] text-[#3B4B5A] uppercase hover:text-[#0B1218] dark:border-[#161616] dark:text-[#D4D4D4] dark:hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <a
              href={docsHref}
              onClick={() => setMobileOpen(false)}
              className="font-mono-tech border-b border-[#EDF2F7] py-3.5 text-[12px] tracking-[0.12em] text-[#3B4B5A] uppercase hover:text-[#0B1218] dark:border-[#161616] dark:text-[#D4D4D4] dark:hover:text-white"
            >
              Docs
            </a>
          </nav>

          {/* Mobile 3-way Theme Selector */}
          <div className="mt-4">
            <p className="font-mono-tech text-[10px] tracking-[0.12em] text-[#607284] uppercase dark:text-[#738494]">
              Theme
            </p>
            <div
              role="radiogroup"
              aria-label="Mobile color theme"
              className="mt-2 grid grid-cols-3 border border-[#D4DEE8] bg-[#EEF3F7] p-0.5 dark:border-[#242D36] dark:bg-[#090D12]"
            >
              {THEME_OPTIONS.map(({ mode, label, Icon }) => {
                const active = mounted ? theme === mode : mode === "system";
                return (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTheme(mode)}
                    className={`font-mono-tech inline-flex min-h-[44px] items-center justify-center gap-1.5 text-[11px] tracking-[0.08em] uppercase transition-colors cursor-pointer ${
                      active
                        ? "bg-white text-[#0B1218] font-medium shadow-[0_1px_2px_rgba(11,18,24,0.08)] dark:bg-[#142535] dark:text-white dark:shadow-none"
                        : "text-[#5A6C7D] dark:text-[#7E90A0]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {!isAuthenticated && (
              <a
                href={loginHref}
                onClick={() => setMobileOpen(false)}
                className="font-mono-tech inline-flex min-h-[44px] items-center justify-center border border-[#D4DEE8] bg-white px-4 text-[12px] tracking-[0.08em] text-[#0B1218] uppercase dark:border-[#303030] dark:bg-black dark:text-white"
              >
                Sign in
              </a>
            )}
            <a
              href={primaryHref}
              onClick={() => setMobileOpen(false)}
              className={`font-mono-tech inline-flex min-h-[44px] items-center justify-center bg-[#1F5B7C] px-4 text-[12px] font-medium tracking-[0.08em] text-white uppercase ${
                isAuthenticated ? "col-span-2" : ""
              }`}
            >
              {isAuthenticated ? "Workspace" : "Open Gyra"}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
