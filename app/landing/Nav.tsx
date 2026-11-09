"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GyraMark from "../components/GyraMark";

type NavItem = {
  label: string;
  href: string;
  hint: string;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "capabilities",
    label: "Capabilities",
    items: [
      { label: "01 · Chat", href: "#chat", hint: "Natural dialogue & reasoning" },
      { label: "02 · Research", href: "#research", hint: "Live web synthesis & citations" },
      { label: "03 · Image", href: "#image", hint: "High-resolution visual creation" },
      { label: "04 · Video", href: "#video", hint: "Cinematic motion generation" },
      { label: "05 · Voice", href: "#voice", hint: "Neural speech & audio studio" },
      { label: "06 · Build", href: "#build", hint: "Autonomous software engineering" },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    items: [
      { label: "Gyra Workspace", href: "/dashboard", hint: "Unified chat, research & build" },
      { label: "Creative Studio", href: "/studio", hint: "Image, video & voice generation" },
      { label: "Projects", href: "/projects", hint: "Multi-file workspaces & automations" },
      { label: "Prompt Library", href: "/library", hint: "Curated workflows & templates" },
    ],
  },
  {
    id: "developers",
    label: "Developers",
    items: [
      { label: "API Platform", href: "/api", hint: "OpenAI-compatible intelligence endpoints" },
      { label: "Documentation", href: "/docs", hint: "Guides, SDKs & reference" },
      { label: "API Playground", href: "/playground", hint: "Test models & parameters live" },
      { label: "Developer Console", href: "/console", hint: "Usage analytics & billing" },
      { label: "API Keys", href: "/api-keys", hint: "Manage authentication tokens" },
      { label: "Changelog", href: "/changelog", hint: "Platform releases & updates" },
    ],
  },
  {
    id: "company",
    label: "Company",
    items: [
      { label: "About Genvia AI", href: "/about", hint: "Our mission & intelligence research" },
      { label: "System Status", href: "/status", hint: "Real-time service health" },
      { label: "Contact", href: "/contact", hint: "Enterprise & support enquiries" },
      { label: "Privacy Policy", href: "/privacy", hint: "How we protect your data" },
      { label: "Terms of Service", href: "/terms", hint: "Platform usage terms" },
    ],
  },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest(".gy-nav")) {
        setOpenMenu(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("click", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("click", onClickOutside);
    };
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`gy-nav ${scrolled ? "gy-nav-scrolled" : ""}`}
        aria-label="Primary navigation"
      >
        <div className="gy-nav-inner">
          {/* Zone 1: Brand Identity */}
          <Link
            href="/"
            className="gy-nav-brand"
            aria-label="Gyra home"
            onClick={() => {
              setOpenMenu(null);
              setMobileOpen(false);
            }}
          >
            <GyraMark size={26} glow={false} animated={false} />
            <span className="gy-nav-word">GYRA</span>
          </Link>

          {/* Zone 2: Desktop Navigation Links */}
          <div className="gy-nav-center">
            {NAV_GROUPS.map((group) => {
              const isOpen = openMenu === group.id;
              return (
                <div
                  key={group.id}
                  className="gy-nav-group"
                  onMouseEnter={() => setOpenMenu(group.id)}
                  onMouseLeave={() => setOpenMenu((cur) => (cur === group.id ? null : cur))}
                >
                  <button
                    type="button"
                    className={`gy-nav-link ${isOpen ? "gy-nav-link-active" : ""}`}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    onClick={() => setOpenMenu(isOpen ? null : group.id)}
                  >
                    <span>{group.label}</span>
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      className={`gy-nav-chev ${isOpen ? "gy-nav-chev-open" : ""}`}
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="gy-nav-dropdown" role="menu">
                      {group.items.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          role="menuitem"
                          className="gy-nav-drop-item"
                          onClick={() => setOpenMenu(null)}
                        >
                          <span className="gy-nav-drop-title">{item.label}</span>
                          <span className="gy-nav-drop-hint">{item.hint}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <Link
              href="#pricing"
              className="gy-nav-link"
              onClick={() => setOpenMenu(null)}
            >
              Pricing
            </Link>
          </div>

          {/* Zone 3: Primary Actions */}
          <div className="gy-nav-actions">
            <Link href="/login" className="gy-nav-ghost">
              Log in
            </Link>
            <Link href="/dashboard" className="gy-nav-cta">
              Open Gyra
            </Link>
            <button
              type="button"
              className={`gy-nav-burger ${mobileOpen ? "on" : ""}`}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileOpen}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* Intentional Mobile Navigation Sheet */}
      <div
        className={`gy-mnav ${mobileOpen ? "open" : ""}`}
        aria-hidden={!mobileOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="gy-mnav-head">
          <Link
            href="/"
            className="gy-nav-brand"
            onClick={() => setMobileOpen(false)}
          >
            <GyraMark size={24} glow={false} animated={false} />
            <span className="gy-nav-word">GYRA</span>
          </Link>
          <button
            type="button"
            className="gy-mnav-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="gy-mnav-body">
          <div className="gy-mnav-cta-top">
            <Link
              href="/dashboard"
              className="gy-nav-cta gy-mnav-btn-full"
              onClick={() => setMobileOpen(false)}
            >
              Open Gyra Workspace
            </Link>
            <Link
              href="/login"
              className="gy-nav-ghost gy-mnav-btn-full"
              onClick={() => setMobileOpen(false)}
            >
              Log in
            </Link>
          </div>

          {NAV_GROUPS.map((group) => (
            <div key={group.id} className="gy-mnav-section">
              <p className="gy-mnav-label">{group.label}</p>
              <div className="gy-mnav-grid">
                {group.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="gy-mnav-item"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="gy-mnav-item-title">{item.label}</span>
                    <span className="gy-mnav-item-hint">{item.hint}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="gy-mnav-section">
            <p className="gy-mnav-label">Plans & Credits</p>
            <div className="gy-mnav-grid">
              <Link
                href="#pricing"
                className="gy-mnav-item"
                onClick={() => setMobileOpen(false)}
              >
                <span className="gy-mnav-item-title">Pricing & SuperGyra</span>
                <span className="gy-mnav-item-hint">Monthly, yearly & top-up credit packs</span>
              </Link>
              <Link
                href="/upgrade"
                className="gy-mnav-item"
                onClick={() => setMobileOpen(false)}
              >
                <span className="gy-mnav-item-title">Upgrade Account</span>
                <span className="gy-mnav-item-hint">Unlock full studio & generation credits</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="gy-mnav-scrim"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
