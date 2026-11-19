"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { resolveGyraRoute } from "../../lib/landingSimulations";

export interface NavbarProps {
  isAuthenticated?: boolean;
  routeBase?: string;
}

const NAV_ITEMS = [
  { label: "Chat", href: "#chat" },
  { label: "Image", href: "#image" },
  { label: "Video", href: "#video" },
  { label: "Platform", href: "#architecture" },
  { label: "API", href: "#developers" },
] as const;

export function Navbar({ isAuthenticated = false, routeBase = "" }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const primaryHref = resolveGyraRoute("/dashboard", routeBase);
  const loginHref = resolveGyraRoute("/login", routeBase);
  const docsHref = resolveGyraRoute("/docs", routeBase);

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-[#1F1F1F] bg-black">
      <div className="mx-auto flex h-full max-w-[1380px] items-center justify-between gap-8 px-5 sm:px-8">
        {/* Zone 1: Clean single-element Brand mark */}
        <a
          href={resolveGyraRoute("/", routeBase)}
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF3D00]"
          aria-label="Gyra Home"
        >
          <img
            src="/gyra-logo.png"
            alt="Gyra"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
          <span className="font-display text-[20px] font-bold tracking-[0.06em] text-white uppercase">
            Gyra
          </span>
        </a>

        {/* Zone 2: 5 concise single-line monospace navigation links */}
        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="font-mono-tech shrink-0 whitespace-nowrap text-[12px] tracking-[0.1em] text-[#A3A3A3] uppercase transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF3D00]"
            >
              {item.label}
            </a>
          ))}
          <a
            href={docsHref}
            className="font-mono-tech shrink-0 whitespace-nowrap text-[12px] tracking-[0.1em] text-[#A3A3A3] uppercase transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF3D00]"
          >
            Docs
          </a>
        </nav>

        {/* Zone 3: Crisp 0px-radius action zone */}
        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {!isAuthenticated && (
            <a
              href={loginHref}
              className="font-mono-tech shrink-0 whitespace-nowrap px-3 py-2 text-[12px] tracking-[0.08em] text-[#CCCCCC] uppercase transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF3D00]"
            >
              Sign in
            </a>
          )}
          <a
            href={primaryHref}
            className="font-mono-tech inline-flex shrink-0 items-center justify-center whitespace-nowrap bg-white px-4 py-2 text-[12px] font-medium tracking-[0.08em] text-black uppercase transition-colors duration-150 hover:bg-[#E5E5E5] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF3D00]"
          >
            {isAuthenticated ? "Dashboard" : "Open Gyra"}
          </a>
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="gyra-mobile-nav"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          className="inline-flex h-10 w-10 items-center justify-center border border-[#262626] bg-black text-white transition-colors hover:border-[#444] lg:hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF3D00]"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          id="gyra-mobile-nav"
          className="border-b border-[#1F1F1F] bg-black px-5 pb-6 pt-4 lg:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col border-t border-[#1F1F1F]">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="font-mono-tech border-b border-[#161616] py-3.5 text-[12px] tracking-[0.12em] text-[#D4D4D4] uppercase hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <a
              href={docsHref}
              onClick={() => setMobileOpen(false)}
              className="font-mono-tech border-b border-[#161616] py-3.5 text-[12px] tracking-[0.12em] text-[#D4D4D4] uppercase hover:text-white"
            >
              Docs
            </a>
          </nav>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {!isAuthenticated && (
              <a
                href={loginHref}
                onClick={() => setMobileOpen(false)}
                className="font-mono-tech inline-flex min-h-[44px] items-center justify-center border border-[#303030] bg-black px-4 text-[12px] tracking-[0.08em] text-white uppercase"
              >
                Sign in
              </a>
            )}
            <a
              href={primaryHref}
              onClick={() => setMobileOpen(false)}
              className={`font-mono-tech inline-flex min-h-[44px] items-center justify-center bg-[#FF3D00] px-4 text-[12px] font-medium tracking-[0.08em] text-white uppercase ${
                isAuthenticated ? "col-span-2" : ""
              }`}
            >
              {isAuthenticated ? "Dashboard" : "Open Gyra"}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
