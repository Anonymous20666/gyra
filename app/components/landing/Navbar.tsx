"use client";

import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { resolveGyraRoute } from "../../lib/landingSimulations";

interface NavbarProps {
  routeBase?: string;
  isAuthenticated?: boolean;
}

const NAV_ITEMS = [
  { label: "Chat", href: "#chat" },
  { label: "Image", href: "#image" },
  { label: "Video", href: "#video" },
  { label: "Architecture", href: "#architecture" },
  { label: "API", href: "#developers" },
  { label: "Docs", href: "/docs" },
  { label: "About", href: "/about" },
] as const;

export function Navbar({ routeBase = "", isAuthenticated = false }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#050608] border-b border-white/[0.08]">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <a
          href={resolveGyraRoute("/", routeBase)}
          className="flex items-center gap-2.5 group focus-visible:outline-2"
          aria-label="Gyra Home"
        >
          <img
            src="/gyra-logo.png"
            alt="Gyra"
            width={26}
            height={26}
            className="w-[26px] h-[26px] object-contain"
          />
          <span className="font-display font-semibold tracking-[-0.02em] text-[15px] text-[#F5F7FA]">
            Gyra
          </span>
          <span className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-[0.12em] text-[#667085] border-l border-white/[0.1] pl-2.5">
            Genvia AI
          </span>
        </a>

        <nav aria-label="Primary" className="hidden lg:flex items-center gap-7">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={resolveGyraRoute(item.href, routeBase)}
              className="text-[13px] font-medium text-[#A0A8B8] hover:text-[#F5F7FA] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated ? (
            <a
              href={resolveGyraRoute("/dashboard", routeBase)}
              className="inline-flex items-center gap-1.5 bg-[#F1F5F9] text-[#050608] hover:bg-white px-4 py-2 rounded-[4px] text-[13px] font-medium transition-colors"
            >
              Open Dashboard
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          ) : (
            <>
              <a
                href={resolveGyraRoute("/login", routeBase)}
                className="text-[13px] font-medium text-[#A0A8B8] hover:text-[#F5F7FA] px-3 py-2 transition-colors"
              >
                Sign in
              </a>
              <a
                href={resolveGyraRoute("/dashboard", routeBase)}
                className="inline-flex items-center gap-1.5 bg-[#F1F5F9] text-[#050608] hover:bg-white px-4 py-2 rounded-[4px] text-[13px] font-medium transition-colors"
              >
                Open Gyra
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-drawer"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-[4px] border border-white/[0.1] text-[#F5F7FA] hover:bg-[#101319] transition-colors"
        >
          {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {menuOpen && (
        <div
          id="mobile-nav-drawer"
          className="lg:hidden bg-[#0B0D11] border-t border-white/[0.08] px-5 py-5"
        >
          <nav aria-label="Mobile" className="flex flex-col divide-y divide-white/[0.06]">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={resolveGyraRoute(item.href, routeBase)}
                onClick={() => setMenuOpen(false)}
                className="py-3 text-[15px] font-medium text-[#D0D5DD] hover:text-[#F5F7FA] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 pt-5 border-t border-white/[0.08] flex flex-col gap-2.5">
            {!isAuthenticated && (
              <a
                href={resolveGyraRoute("/login", routeBase)}
                onClick={() => setMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-[4px] border border-white/[0.12] text-[14px] font-medium text-[#F5F7FA] hover:bg-[#161A22] transition-colors"
              >
                Sign in
              </a>
            )}
            <a
              href={resolveGyraRoute("/dashboard", routeBase)}
              onClick={() => setMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-[4px] bg-[#F1F5F9] text-[#050608] text-[14px] font-medium hover:bg-white transition-colors"
            >
              {isAuthenticated ? "Open Dashboard" : "Open Gyra"}
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
