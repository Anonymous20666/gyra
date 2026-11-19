"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import {
  AVAILABILITY_LABELS,
  ECOSYSTEM_ITEMS,
  GYRA_COMPANY,
  ROADMAP_ITEMS,
} from "../../lib/gyraCatalog";
import { resolveGyraRoute } from "../../lib/landingSimulations";

export interface EcosystemRoadmapProps {
  routeBase?: string;
}

export function EcosystemRoadmap({ routeBase = "" }: EcosystemRoadmapProps) {
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  const handleCopyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText("https://gyra.ng/api/v1/chat");
    } catch {
      // Clipboard fallback ignored
    }
    setCopiedEndpoint(true);
    window.setTimeout(() => setCopiedEndpoint(false), 1800);
  };

  return (
    <>
      {/* Ecosystem & Honest Roadmap Matrix (E2B Border-Collapsed Tile Grid) */}
      <section id="ecosystem" className="border-b border-[#1F1F1F] bg-black py-24 lg:py-32">
        <div className="mx-auto max-w-[1380px] px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono-tech text-[12px] tracking-[0.14em] text-[#8A8A8A] uppercase">
              [ Expanding Ecosystem ]
            </p>
            <h2 className="font-display mt-4 text-[clamp(2.5rem,4.6vw,4.2rem)] font-bold leading-[0.95] tracking-[-0.02em] text-white uppercase [text-wrap:balance]">
              Built to grow into a complete AI suite.
            </h2>
            <p className="mx-auto mt-5 max-w-[54ch] text-[15px] leading-[1.65] text-[#9A9A9A]">
              Start with Gyra Chat, Image, and Video — then expand into file-grounded Projects,
              Forge coding sandboxes, Journal, Telegram, and developer APIs.
            </p>
          </div>

          {/* Active Surfaces Border-Collapsed Matrix */}
          <div className="mt-14">
            <p className="font-mono-tech mb-4 text-center text-[11px] tracking-[0.14em] text-[#737373] uppercase">
              [ Shipped & Preview Workspaces ]
            </p>
            <div className="grid grid-cols-1 border-l border-t border-[#1F1F1F] md:grid-cols-2 lg:grid-cols-3">
              {ECOSYSTEM_ITEMS.map((item) => {
                const isExternal = Boolean(item.external);
                return (
                  <a
                    key={item.id}
                    href={resolveGyraRoute(item.route, routeBase)}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer" : undefined}
                    className="group relative flex flex-col justify-between border-b border-r border-[#1F1F1F] bg-black p-7 transition-colors duration-150 hover:bg-[#080808] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#5B9EC2]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 font-mono-tech text-[10px] tracking-[0.1em] uppercase">
                        <span className="text-[#737373]">{item.meta}</span>
                        <span
                          className={
                            item.availability === "preview"
                              ? "border border-[#5B9EC2]/60 px-2 py-0.5 text-[#5B9EC2]"
                              : "text-[#A3A3A3]"
                          }
                        >
                          {AVAILABILITY_LABELS[item.availability]}
                        </span>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-2">
                        <h3 className="font-display text-[22px] font-bold tracking-[-0.01em] text-white uppercase transition-colors group-hover:text-[#5B9EC2]">
                          {item.name}
                        </h3>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-[#666666] transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#5B9EC2]" />
                      </div>

                      <p className="mt-2.5 text-[14px] leading-[1.6] text-[#8E8E8E]">
                        {item.description}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Candid Roadmap Strip */}
          <div className="mt-12">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 font-mono-tech text-[11px] tracking-[0.12em] uppercase">
              <span className="text-[#737373]">[ In Development · Roadmap ]</span>
              <a
                href={resolveGyraRoute("/changelog", routeBase)}
                className="inline-flex items-center gap-1 text-white underline decoration-[#303030] underline-offset-4 hover:text-[#5B9EC2] hover:decoration-[#5B9EC2]"
              >
                Shipped releases in Changelog
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="grid grid-cols-1 border-l border-t border-[#1F1F1F] sm:grid-cols-2 lg:grid-cols-4">
              {ROADMAP_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="border-b border-r border-[#1F1F1F] bg-[#040404] p-5"
                >
                  <p className="font-mono-tech text-[10px] tracking-[0.12em] text-[#5B9EC2] uppercase">
                    {item.scope}
                  </p>
                  <h3 className="mt-2 text-[15px] font-semibold text-white">{item.name}</h3>
                  <p className="mt-1.5 text-[13px] leading-[1.55] text-[#808080]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Iconic E2B-Style Dithered Pre-Footer CTA Stage */}
      <section className="relative overflow-hidden border-b border-[#1F1F1F] bg-black py-24 lg:py-32">
        <div
          aria-hidden="true"
          className="gyra-dither-backdrop pointer-events-none absolute inset-0 opacity-60"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.72) 50%, rgba(0,0,0,0.25) 100%)",
          }}
        />

        <div className="relative mx-auto flex max-w-[920px] flex-col items-center px-5 text-center sm:px-8">
          <p className="font-mono-tech border border-[#242424] bg-black px-3.5 py-1.5 text-[11px] tracking-[0.14em] text-[#CCCCCC] uppercase">
            Genvia AI Company · Unified Platform
          </p>

          <h2 className="font-display mt-6 text-[clamp(2.75rem,5.4vw,4.75rem)] font-bold leading-[0.94] tracking-[-0.02em] text-white uppercase">
            One intelligence
            <br />
            <span className="text-[#5B9EC2]">every medium</span>
          </h2>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={resolveGyraRoute("/dashboard", routeBase)}
              className="font-mono-tech inline-flex min-h-[46px] shrink-0 items-center justify-center bg-[#1F5B7C] px-7 text-[13px] font-medium tracking-[0.1em] text-white uppercase transition-colors hover:bg-[#296E93]"
            >
              Start Building
            </a>
            <a
              href={resolveGyraRoute("/docs", routeBase)}
              className="font-mono-tech inline-flex min-h-[46px] shrink-0 items-center justify-center border border-[#3A3A3A] bg-black px-7 text-[13px] font-medium tracking-[0.1em] text-white uppercase transition-colors hover:border-white"
            >
              Read Documentation
            </a>
          </div>

          <button
            type="button"
            onClick={handleCopyEndpoint}
            className="font-mono-tech mt-6 inline-flex items-center gap-2 text-[12px] text-[#808080] transition-colors hover:text-white"
          >
            <span>POST https://gyra.ng/api/v1/chat</span>
            {copiedEndpoint ? (
              <Check className="h-3.5 w-3.5 text-[#5B9EC2]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </section>

      {/* Pitch-Black Architectural Footer */}
      <footer className="bg-black py-16">
        <div className="mx-auto max-w-[1380px] px-5 sm:px-8">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
            <div className="col-span-2">
              <a
                href={resolveGyraRoute("/", routeBase)}
                className="inline-flex items-center gap-2.5"
              >
                <img
                  src="/gyra-logo.png"
                  alt="Gyra"
                  width={22}
                  height={22}
                  className="h-[22px] w-[22px] object-contain"
                />
                <span className="font-display text-[19px] font-bold tracking-[0.06em] text-white uppercase">
                  Gyra
                </span>
              </a>
              <p className="mt-4 max-w-[28ch] text-[13px] leading-[1.6] text-[#808080]">
                {GYRA_COMPANY.tagline} Built by {GYRA_COMPANY.parentCompany}.
              </p>
              <a
                href={`mailto:${GYRA_COMPANY.emails.support}`}
                className="font-mono-tech mt-3 inline-block text-[12px] text-[#A3A3A3] transition-colors hover:text-[#5B9EC2]"
              >
                {GYRA_COMPANY.emails.support}
              </a>
            </div>

            <div>
              <h3 className="font-mono-tech text-[11px] tracking-[0.12em] text-[#666666] uppercase">
                Products
              </h3>
              <ul className="mt-4 space-y-2.5 text-[13px] text-[#A3A3A3]">
                <li>
                  <a href={resolveGyraRoute("/dashboard", routeBase)} className="hover:text-white">
                    Gyra Chat
                  </a>
                </li>
                <li>
                  <a href="#image" className="hover:text-white">
                    Gyra Image
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/studio", routeBase)} className="hover:text-white">
                    Gyra Video Studio
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/projects", routeBase)} className="hover:text-white">
                    Projects
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/products", routeBase)} className="hover:text-white">
                    All Products
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-mono-tech text-[11px] tracking-[0.12em] text-[#666666] uppercase">
                Developers
              </h3>
              <ul className="mt-4 space-y-2.5 text-[13px] text-[#A3A3A3]">
                <li>
                  <a href={resolveGyraRoute("/api", routeBase)} className="hover:text-white">
                    API Overview
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/docs", routeBase)} className="hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/playground", routeBase)} className="hover:text-white">
                    Playground
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/console", routeBase)} className="hover:text-white">
                    Console
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/api-keys", routeBase)} className="hover:text-white">
                    API Keys
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-mono-tech text-[11px] tracking-[0.12em] text-[#666666] uppercase">
                Company
              </h3>
              <ul className="mt-4 space-y-2.5 text-[13px] text-[#A3A3A3]">
                <li>
                  <a href={resolveGyraRoute("/about", routeBase)} className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/changelog", routeBase)} className="hover:text-white">
                    Changelog
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/contact", routeBase)} className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/privacy", routeBase)} className="hover:text-white">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/terms", routeBase)} className="hover:text-white">
                    Terms
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-mono-tech text-[11px] tracking-[0.12em] text-[#666666] uppercase">
                Channels
              </h3>
              <ul className="mt-4 space-y-2.5 text-[13px] text-[#A3A3A3]">
                {GYRA_COMPANY.socials.map((social) => (
                  <li key={social.id}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-[#1F1F1F] pt-6 sm:flex-row sm:items-center">
            <p className="font-mono-tech text-[11px] text-[#666666]">
              © {GYRA_COMPANY.foundedYear} {GYRA_COMPANY.brand} · {GYRA_COMPANY.parentCompany}. All
              rights reserved.
            </p>
            <div className="font-mono-tech flex items-center gap-6 text-[11px] text-[#808080] uppercase">
              <a href={resolveGyraRoute("/upgrade", routeBase)} className="hover:text-white">
                SuperGyra Plans
              </a>
              <a href={resolveGyraRoute("/status", routeBase)} className="hover:text-white">
                System Status
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
