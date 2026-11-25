"use client";

import Link from "next/link";
import { ArrowUpRight, Moon, Sun } from "lucide-react";
import GyraMark from "@/app/components/GyraMark";
import { useTheme } from "@/app/components/ThemeProvider";

export default function SamplesHeader() {
  const { resolved, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Brand + Product Identifier */}
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B9EC2]"
          >
            <GyraMark size={24} />
            <span
              className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 whitespace-nowrap"
              style={{ fontFamily: "var(--font-gyra-display), sans-serif" }}
            >
              Gyra
            </span>
          </Link>
          <span
            aria-hidden="true"
            className="text-zinc-300 dark:text-zinc-700 select-none shrink-0"
          >
            /
          </span>
          <span className="truncate text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Prompt Samples
          </span>
        </div>

        {/* Center nav links on desktop */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-500 dark:text-zinc-400"
        >
          <Link
            href="/dashboard"
            className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
          >
            Chat
          </Link>
          <Link
            href="/projects"
            className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
          >
            Projects
          </Link>
          <Link
            href="/playground"
            className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
          >
            Playground
          </Link>
          <Link
            href="/console"
            className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
          >
            Console
          </Link>
        </nav>

        {/* Right: Theme toggle + Primary Open Chat CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggle}
            aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={resolved === "dark" ? "Light mode" : "Dark mode"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
          >
            {resolved === "dark" ? (
              <Sun className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Moon className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>

          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3.5 text-xs font-medium text-white dark:text-zinc-950 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
          >
            <span>Open Chat</span>
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </header>
  );
}
