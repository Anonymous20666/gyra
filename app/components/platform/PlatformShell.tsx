"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  CreditCard,
  FileClock,
  FolderKanban,
  HelpCircle,
  KeyRound,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  Monitor,
  Moon,
  SlidersHorizontal,
  Sun,
  Terminal,
  User,
  X,
} from "lucide-react";
import { GyraLogoMark } from "../landing/GyraLogoMark";
import { useTheme } from "../ThemeProvider";
import { supabase } from "../../supabase";
import {
  PLATFORM_NAV_GROUPS,
  buildBreadcrumbs,
  isNavItemActive,
  type NavIconName,
} from "../../lib/platformNavigation";
import type { ThemeMode } from "../../lib/themePreference";

const SIDEBAR_STORAGE_KEY = "gyra:sidebar";

function NavIcon({ name, className = "h-4 w-4 shrink-0" }: { name: NavIconName; className?: string }) {
  switch (name) {
    case "overview":
      return <LayoutGrid className={className} />;
    case "playground":
      return <SlidersHorizontal className={className} />;
    case "models":
      return <Boxes className={className} />;
    case "chat":
      return <MessageSquare className={className} />;
    case "projects":
      return <FolderKanban className={className} />;
    case "api":
      return <Code2 className={className} />;
    case "keys":
      return <KeyRound className={className} />;
    case "docs":
      return <BookOpen className={className} />;
    case "console":
      return <Terminal className={className} />;
    case "products":
      return <LayoutGrid className={className} />;
    case "changelog":
      return <FileClock className={className} />;
    case "status":
      return <Activity className={className} />;
    case "support":
      return <HelpCircle className={className} />;
    case "account":
      return <User className={className} />;
    case "credits":
      return <CreditCard className={className} />;
  }
}

export interface PlatformShellProps {
  title: string;
  description?: string;
  breadcrumbLeaf?: string;
  actions?: ReactNode;
  fullBleed?: boolean;
  children: ReactNode;
}

function PlatformShellInner({
  title,
  description,
  breadcrumbLeaf,
  actions,
  fullBleed = false,
  children,
}: PlatformShellProps) {
  const pathname = usePathname() || "/workspace";
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, setTheme, mounted } = useTheme();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    playground: true,
    docs: false,
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  const activeModeQuery = searchParams?.get("mode") || "chat";

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved === "collapsed") setCollapsed(true);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return;
        setUserEmail(data.user?.email ?? null);
        setAuthLoaded(true);
      })
      .catch(() => {
        if (active) setAuthLoaded(true);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (active) setUserEmail(session?.user?.email ?? null);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, activeModeQuery]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "collapsed" : "expanded");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut().catch(() => {});
    setUserEmail(null);
    router.push("/login");
  };

  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(pathname, breadcrumbLeaf),
    [pathname, breadcrumbLeaf],
  );

  const themeOptions: { mode: ThemeMode; label: string; icon: ReactNode }[] = [
    { mode: "light", label: "Light", icon: <Sun className="h-3.5 w-3.5" /> },
    { mode: "dark", label: "Dark", icon: <Moon className="h-3.5 w-3.5" /> },
    { mode: "system", label: "System", icon: <Monitor className="h-3.5 w-3.5" /> },
  ];

  const renderNavContent = (isCompact: boolean) => (
    <div className="flex h-full flex-col">
      {/* Brand Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#DCE4EC] px-3.5 dark:border-white/10">
        <Link
          href="/workspace"
          className="flex min-w-0 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1F5B7C]"
        >
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center border border-[#CBD6E2] bg-[#05080D] p-[2px] dark:border-white/12 dark:bg-black">
            <GyraLogoMark size={20} />
          </span>
          {!isCompact && (
            <span className="font-display truncate text-[16px] font-bold tracking-[0.16em] text-[#0B1218] uppercase dark:text-white">
              Gyra
            </span>
          )}
        </Link>
        {!isCompact && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
            className="hidden h-7 w-7 items-center justify-center text-[#5A6D7E] transition-colors hover:bg-[#EBF1F6] hover:text-[#0B1218] lg:inline-flex dark:text-[#7E92A4] dark:hover:bg-white/8 dark:hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Grouped Navigation */}
      <nav
        aria-label="Platform navigation"
        className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5"
      >
        {PLATFORM_NAV_GROUPS.map((group) => (
          <div key={group.id}>
            {!isCompact && (
              <p className="px-2.5 pb-1.5 font-mono-tech text-[10px] font-medium tracking-[0.14em] text-[#66798A] uppercase dark:text-[#687C8E]">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isNavItemActive(item.href, pathname);
                const hasChildren = Boolean(item.children?.length);
                const isExpanded = Boolean(expandedItems[item.id] || active);

                return (
                  <li key={item.id}>
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        title={isCompact ? item.label : undefined}
                        className={`flex min-h-[36px] flex-1 items-center gap-2.5 px-2.5 py-1.5 text-[13px] font-medium transition-colors whitespace-nowrap ${
                          active
                            ? "bg-[#E6F0F6] text-[#0B1218] dark:bg-[#1F5B7C]/24 dark:text-white"
                            : "text-[#425567] hover:bg-[#EDF2F7] hover:text-[#0B1218] dark:text-[#96A7B6] dark:hover:bg-white/[0.05] dark:hover:text-white"
                        } ${isCompact ? "justify-center px-0" : ""}`}
                      >
                        <NavIcon
                          name={item.icon}
                          className={`h-4 w-4 shrink-0 ${
                            active
                              ? "text-[#1B587A] dark:text-[#78B5D8]"
                              : "text-[#6B7E90] dark:text-[#6E8294]"
                          }`}
                        />
                        {!isCompact && <span className="truncate">{item.label}</span>}
                      </Link>
                      {!isCompact && hasChildren && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedItems((prev) => ({
                              ...prev,
                              [item.id]: !isExpanded,
                            }))
                          }
                          aria-label={`Toggle ${item.label} sub-navigation`}
                          aria-expanded={isExpanded}
                          className="inline-flex h-8 w-7 shrink-0 items-center justify-center text-[#6B7E90] hover:text-[#0B1218] dark:text-[#6E8294] dark:hover:text-white"
                        >
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform duration-150 ${
                              isExpanded ? "rotate-0" : "-rotate-90"
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {!isCompact && hasChildren && isExpanded && (
                      <ul className="mt-0.5 ml-6 space-y-0.5 border-l border-[#DCE4EC] pl-2.5 dark:border-white/10">
                        {item.children!.map((child) => {
                          const subActive = child.matchQuery
                            ? pathname === "/playground" && activeModeQuery === child.matchQuery
                            : pathname === child.href;
                          return (
                            <li key={child.id}>
                              <Link
                                href={child.href}
                                className={`block py-1.5 pl-2 text-[12px] transition-colors whitespace-nowrap ${
                                  subActive
                                    ? "font-medium text-[#1B587A] dark:text-[#78B5D8]"
                                    : "text-[#586C7E] hover:text-[#0B1218] dark:text-[#8498AA] dark:hover:text-white"
                                }`}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer: Theme + Account */}
      <div className="shrink-0 border-t border-[#DCE4EC] p-2.5 space-y-2.5 dark:border-white/10">
        {isCompact ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            className="flex h-9 w-full items-center justify-center border border-[#DCE4EC] text-[#5A6D7E] hover:text-[#0B1218] dark:border-white/10 dark:text-[#8DA0B2] dark:hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <>
            <div
              role="radiogroup"
              aria-label="Color theme"
              className="grid grid-cols-3 border border-[#D4DFE9] bg-[#F2F6FA] p-0.5 dark:border-white/12 dark:bg-[#05090E]"
            >
              {themeOptions.map((opt) => {
                const selected = mounted ? theme === opt.mode : opt.mode === "system";
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setTheme(opt.mode)}
                    className={`inline-flex items-center justify-center gap-1 py-1.5 font-mono-tech text-[10px] tracking-[0.06em] uppercase transition-colors ${
                      selected
                        ? "bg-white font-medium text-[#0B1218] shadow-xs dark:bg-[#162736] dark:text-white"
                        : "text-[#5C7082] hover:text-[#0B1218] dark:text-[#7B90A2] dark:hover:text-white"
                    }`}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {authLoaded && userEmail ? (
              <div className="flex items-center justify-between gap-2 border border-[#DCE4EC] bg-white px-2.5 py-2 dark:border-white/10 dark:bg-[#05090E]">
                <Link href="/account" className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-[#0B1218] dark:text-white">
                    {userEmail}
                  </p>
                  <p className="font-mono-tech text-[10px] text-[#5D7183] dark:text-[#7E92A4]">
                    Account settings
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  title="Sign out"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[#5D7183] transition-colors hover:bg-[#EDF2F7] hover:text-[#0B1218] dark:text-[#7E92A4] dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex min-h-[36px] w-full items-center justify-center border border-[#1B587A] bg-[#1B587A] px-3 py-1.5 font-mono-tech text-[11px] font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-[#164A68] dark:border-[#5B9EC2] dark:bg-[#1F5B7C] dark:hover:bg-[#286D93]"
              >
                Sign In to Gyra
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-[#F6F8FA] text-[#0B1218] transition-colors duration-200 dark:bg-black dark:text-[#F5F5F5]">
      <a
        href="#platform-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-[#5B9EC2] focus:bg-black focus:px-4 focus:py-2 focus:font-mono-tech focus:text-[12px] focus:text-white"
      >
        Skip to content
      </a>

      {/* Desktop Collapsible Sidebar */}
      <aside
        data-testid="platform-sidebar"
        data-collapsed={collapsed ? "true" : "false"}
        className={`hidden shrink-0 border-r border-[#DCE4EC] bg-white transition-[width] duration-200 lg:sticky lg:top-0 lg:block lg:h-screen dark:border-white/10 dark:bg-[#03060A] ${
          collapsed ? "w-[68px]" : "w-[252px]"
        }`}
      >
        {renderNavContent(collapsed)}
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/55 backdrop-blur-[1px]"
          />
          <aside
            data-testid="platform-mobile-drawer"
            className="relative z-10 flex h-full w-[280px] max-w-[84vw] flex-col border-r border-[#DCE4EC] bg-white dark:border-white/12 dark:bg-[#04080D]"
          >
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation drawer"
              className="absolute right-2.5 top-2.5 z-20 inline-flex h-9 w-9 items-center justify-center text-[#5A6D7E] hover:text-[#0B1218] dark:text-[#8CA0B2] dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            {renderNavContent(false)}
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className={`flex min-w-0 flex-1 flex-col ${fullBleed ? "min-h-0 overflow-hidden" : ""}`}>
        {/* Contextual Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[#DCE4EC] bg-white/95 px-4 backdrop-blur-sm sm:px-6 dark:border-white/10 dark:bg-[#03060A]/95">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-[#DCE4EC] text-[#35485A] hover:bg-[#EDF2F7] lg:hidden dark:border-white/12 dark:text-[#B8CAD9] dark:hover:bg-white/8"
            >
              <Menu className="h-4 w-4" />
            </button>

            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[12px]">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <span key={`${crumb.label}-${idx}`} className={`min-w-0 items-center gap-1.5 ${isLast ? "flex" : "hidden sm:flex"}`}>
                    {idx > 0 && (
                      <span className="hidden sm:inline text-[#9AAAB8] dark:text-[#4D6070]" aria-hidden="true">
                        /
                      </span>
                    )}
                    {crumb.href && !isLast ? (
                      <Link
                        href={crumb.href}
                        className="truncate text-[#5B6E80] transition-colors hover:text-[#0B1218] dark:text-[#8699AA] dark:hover:text-white"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="truncate font-medium text-[#0B1218] dark:text-white">
                        {crumb.label}
                      </span>
                    )}
                  </span>
                );
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            {actions}
            <Link
              href="/"
              className="hidden border border-[#DCE4EC] px-2.5 py-1.5 font-mono-tech text-[10.5px] tracking-[0.06em] text-[#4C6072] uppercase transition-colors hover:border-[#1B587A] hover:text-[#0B1218] sm:inline-flex dark:border-white/12 dark:text-[#8EA2B4] dark:hover:border-[#5B9EC2] dark:hover:text-white whitespace-nowrap shrink-0"
            >
              Landing
            </Link>
          </div>
        </header>

        {/* Page Viewport */}
        <main id="platform-main" className={fullBleed ? "flex min-h-0 flex-1 flex-col" : "flex-1"}>
          {fullBleed ? (
            children
          ) : (
            <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <div className="mb-6 border-b border-[#DCE4EC] pb-5 dark:border-white/10">
                <h1 className="font-display text-[clamp(1.65rem,1.25rem+1.2vw,2.25rem)] font-bold leading-[1.08] tracking-[-0.015em] text-[#0B1218] dark:text-white">
                  {title}
                </h1>
                {description && (
                  <p className="mt-1.5 max-w-[70ch] text-[14px] leading-[1.6] text-[#55687A] dark:text-[#90A2B2]">
                    {description}
                  </p>
                )}
              </div>
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export function PlatformShell(props: PlatformShellProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F8FA] text-[#0B1218] dark:bg-black dark:text-white" />
      }
    >
      <PlatformShellInner {...props} />
    </Suspense>
  );
}
