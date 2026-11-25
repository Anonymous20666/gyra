"use client";

import React, { useState } from "react";
import {
  Activity,
  BarChart3,
  ArrowLeft,
  BookOpen,
  MessageSquare,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  Menu,
  Terminal,
  X,
} from "lucide-react";
import { GyraMark } from "./GyraMark";

export type PlatformRoute = "console" | "playground";

export type ConsoleSection =
  | "overview"
  | "analytics"
  | "keys"
  | "activity"
  | "billing";

export type DataSourceMode = "demo" | "empty" | "live";

interface DevShellProps {
  route: PlatformRoute;
  consoleSection: ConsoleSection;
  dataMode: DataSourceMode;
  onNavigateRoute: (route: PlatformRoute) => void;
  onSelectConsoleSection: (section: ConsoleSection) => void;
  onChangeDataMode: (mode: DataSourceMode) => void;
  onOpenDocs: () => void;
  activeKeyCount: number;
  children: React.ReactNode;
}

const CONSOLE_NAV_ITEMS: Array<{
  id: ConsoleSection;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "analytics", label: "Usage & Analytics", icon: BarChart3 },
  { id: "keys", label: "API Keys", icon: KeyRound },
  { id: "activity", label: "Activity Logs", icon: Activity },
  { id: "billing", label: "Credits & Billing", icon: CreditCard },
];

const SECTION_TITLES: Record<ConsoleSection, string> = {
  overview: "Overview",
  analytics: "Usage & Analytics",
  keys: "API Keys",
  activity: "Activity Logs",
  billing: "Credits & Billing",
};

export function DevShell({
  route,
  consoleSection,
  dataMode,
  onNavigateRoute,
  onSelectConsoleSection,
  onChangeDataMode,
  onOpenDocs,
  activeKeyCount,
  children,
}: DevShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelectSection = (section: ConsoleSection) => {
    onNavigateRoute("console");
    onSelectConsoleSection(section);
    setMobileMenuOpen(false);
  };

  const handleSelectPlayground = () => {
    onNavigateRoute("playground");
    setMobileMenuOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#1F1F23] shrink-0">
        <button
          type="button"
          onClick={() => handleSelectSection("overview")}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B9EC2] rounded"
        >
          <GyraMark size={28} />
          <span className="font-display text-[15px] font-semibold tracking-tight text-[#F4F4F5] whitespace-nowrap">
            Gyra
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 text-[#A1A1AA] hover:text-[#F4F4F5] rounded-md"
          aria-label="Close navigation menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="px-2.5 mb-2 text-[11px] font-medium text-[#71717A]">
            Developer Console
          </p>
          <nav aria-label="Console navigation" className="space-y-0.5">
            {CONSOLE_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = route === "console" && consoleSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSection(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-[13.5px] font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-[#121215] text-[#F4F4F5]"
                      : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#09090B]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-[#5B9EC2]" : "text-[#71717A]"
                      }`}
                      strokeWidth={1.75}
                    />
                    <span>{item.label}</span>
                  </span>
                  {item.id === "keys" && activeKeyCount > 0 && (
                    <span className="text-[11px] font-mono tabular-nums text-[#71717A]">
                      {activeKeyCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-2.5 mb-2 text-[11px] font-medium text-[#71717A]">
            Developer Tools
          </p>
          <nav aria-label="Developer tools" className="space-y-0.5">
            <button
              type="button"
              onClick={handleSelectPlayground}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13.5px] font-medium transition-colors whitespace-nowrap ${
                route === "playground"
                  ? "bg-[#121215] text-[#F4F4F5]"
                  : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#09090B]"
              }`}
            >
              <Terminal
                className={`w-4 h-4 shrink-0 ${
                  route === "playground" ? "text-[#5B9EC2]" : "text-[#71717A]"
                }`}
                strokeWidth={1.75}
              />
              <span>AI Playground</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenDocs();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13.5px] font-medium text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#09090B] transition-colors whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4 shrink-0 text-[#71717A]" strokeWidth={1.75} />
              <span>API Reference</span>
            </button>
          </nav>
        </div>

        <div>
          <p className="px-2.5 mb-2 text-[11px] font-medium text-[#71717A]">
            Gyra Platform
          </p>
          <nav aria-label="Main Gyra platform" className="space-y-0.5">
            <a
              href="/"
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13.5px] font-medium text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#09090B] transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4 shrink-0 text-[#71717A]" strokeWidth={1.75} />
              <span>Gyra Home</span>
            </a>
            <a
              href="/dashboard"
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13.5px] font-medium text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#09090B] transition-colors whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4 shrink-0 text-[#71717A]" strokeWidth={1.75} />
              <span>Gyra Chat App</span>
            </a>
          </nav>
        </div>
      </div>

      {/* Explicit Data Source Control — never disguise demo data as production */}
      <div className="p-3 border-t border-[#1F1F23] shrink-0">
        <p className="px-1 mb-1.5 text-[11px] font-medium text-[#71717A]">
          Console Data Source
        </p>
        <div
          className="grid grid-cols-3 gap-1 p-1 rounded-md bg-[#000000] border border-[#1F1F23]"
          role="group"
          aria-label="Console data source"
        >
          {(
            [
              { id: "demo", label: "Demo" },
              { id: "empty", label: "Empty" },
              { id: "live", label: "Live" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeDataMode(opt.id)}
              className={`py-1 text-[11.5px] font-medium rounded transition-colors whitespace-nowrap ${
                dataMode === opt.id
                  ? "bg-[#121215] text-[#F4F4F5]"
                  : "text-[#71717A] hover:text-[#A1A1AA]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="px-1 mt-2 text-[11px] leading-snug text-[#71717A]">
          {dataMode === "demo"
            ? "Previewing clearly labeled demonstration analytics."
            : dataMode === "empty"
              ? "Inspecting clean zero-usage empty states."
              : "Connected to live Gyra API endpoints."}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#000000] text-[#F4F4F5] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[232px] lg:flex-col lg:fixed lg:inset-y-0 bg-[#000000] border-r border-[#1F1F23] z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-[264px] max-w-[82vw] bg-[#000000] border-r border-[#1F1F23] z-10 h-full">
            {navContent}
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 lg:pl-[232px] flex flex-col min-w-0">
        {/* Compact Top Header (<= 48px height, clean breadcrumb + 1 primary workspace switch) */}
        <header className="sticky top-0 z-20 h-12 bg-[#000000]/95 backdrop-blur-sm border-b border-[#1F1F23] px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 -ml-1.5 text-[#A1A1AA] hover:text-[#F4F4F5] rounded-md"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] min-w-0">
              <span className="text-[#71717A] whitespace-nowrap hidden sm:inline">
                Gyra Platform
              </span>
              <span className="text-[#3F3F46] hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-medium text-[#F4F4F5] truncate">
                {route === "playground"
                  ? "AI Playground"
                  : `Console · ${SECTION_TITLES[consoleSection]}`}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {route === "console" ? (
              <button
                type="button"
                onClick={handleSelectPlayground}
                className="px-3.5 py-1.5 text-[12.5px] font-medium text-[#F4F4F5] bg-[#1F5B7C] hover:bg-[#286F96] rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Open Playground</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectSection("overview")}
                className="px-3.5 py-1.5 text-[12.5px] font-medium text-[#D4D4D8] bg-[#121215] hover:bg-[#18181B] border border-[#27272A] rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Console</span>
              </button>
            )}
          </div>
        </header>

        {/* Explicit Transparent Banner when Demonstration Data is active on Console */}
        {route === "console" && dataMode === "demo" && (
          <div className="bg-[#09090B] border-b border-[#1F1F23] px-4 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#A1A1AA]">
            <span>
              <strong className="font-medium text-[#D4D4D8]">Demonstration Dataset:</strong>{" "}
              Showing sample balances, keys, and telemetry for interface inspection — not live
              customer production usage.
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onChangeDataMode("empty")}
                className="text-[#5B9EC2] hover:text-[#7DD3FC] font-medium whitespace-nowrap"
              >
                View empty state
              </button>
              <span className="text-[#3F3F46]" aria-hidden="true">
                ·
              </span>
              <button
                type="button"
                onClick={() => onChangeDataMode("live")}
                className="text-[#5B9EC2] hover:text-[#7DD3FC] font-medium whitespace-nowrap"
              >
                Connect live account
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
