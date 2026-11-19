"use client";

import { ArrowUpRight } from "lucide-react";
import {
  AVAILABILITY_LABELS,
  ECOSYSTEM_ITEMS,
  GYRA_COMPANY,
  ROADMAP_ITEMS,
} from "../../lib/gyraCatalog";
import { resolveGyraRoute } from "../../lib/landingSimulations";

interface EcosystemRoadmapProps {
  routeBase?: string;
}

export function EcosystemRoadmap({ routeBase = "" }: EcosystemRoadmapProps) {
  return (
    <>
      {/* Ecosystem & Honest Roadmap */}
      <section
        id="ecosystem"
        aria-labelledby="ecosystem-heading"
        className="bg-[#050608] border-b border-white/[0.08] scroll-mt-16"
      >
        <div className="max-w-[1280px] mx-auto gyra-grid-rail px-5 sm:px-8 py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-12">
            <div className="lg:col-span-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#667085] mb-3">
                06 / Expanding Ecosystem
              </p>
              <h2
                id="ecosystem-heading"
                className="font-display font-semibold text-[30px] sm:text-[38px] lg:text-[42px] tracking-[-0.03em] leading-[1.08] text-[#F5F7FA] [text-wrap:balance]"
              >
                Workspaces, channels, and capabilities engineered to scale together.
              </h2>
            </div>
            <div className="lg:col-span-5 lg:pl-6">
              <p className="text-[15px] text-[#A0A8B8] leading-[1.65]">
                Beyond Gyra Chat, Image, and Video, Genvia AI Company is building connected
                workspaces for research, software engineering, writing, and programmatic automation.
              </p>
            </div>
          </div>

          {/* Active Workspaces & APIs Hairline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-white/[0.08]">
            {ECOSYSTEM_ITEMS.map((item) => (
              <a
                key={item.id}
                href={resolveGyraRoute(item.route, routeBase)}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="group bg-[#080A0E] hover:bg-[#0E1117] border-r border-b border-white/[0.08] p-6 flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#667085]">
                      {item.meta}
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.08em] ${
                        item.availability === "preview" ? "text-[#E5B975]" : "text-[#5EEAD4]"
                      }`}
                    >
                      {AVAILABILITY_LABELS[item.availability]}
                    </span>
                  </div>
                  <h3 className="font-display text-[17px] font-semibold text-[#F5F7FA] tracking-[-0.015em] mb-2 flex items-center justify-between">
                    <span>{item.name}</span>
                    <ArrowUpRight
                      className="w-4 h-4 text-[#667085] group-hover:text-[#F5F7FA] transition-colors shrink-0"
                      aria-hidden="true"
                    />
                  </h3>
                  <p className="text-[13px] text-[#8B94A6] leading-[1.6]">
                    {item.description}
                  </p>
                </div>
              </a>
            ))}
          </div>

          {/* Honest In-Development Roadmap Strip */}
          <div className="mt-14">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#667085]">
                In Development · Roadmap
              </span>
              <a
                href={resolveGyraRoute("/changelog", routeBase)}
                className="font-mono text-[11px] text-[#A0A8B8] hover:text-[#F5F7FA] inline-flex items-center gap-1 transition-colors"
              >
                View shipped releases in Changelog
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] border-x border-b border-white/[0.08] bg-[#07090C]">
              {ROADMAP_ITEMS.map((item) => (
                <div key={item.id} className="p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#667085] mb-1.5">
                    {item.scope}
                  </p>
                  <h3 className="font-display text-[14px] font-semibold text-[#D6DCE6] mb-1.5">
                    {item.name}
                  </h3>
                  <p className="text-[12px] text-[#8B94A6] leading-[1.55]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Closing Architectural CTA */}
      <section aria-labelledby="closing-cta-heading" className="bg-[#0B0D11] border-b border-white/[0.08]">
        <div className="max-w-[1280px] mx-auto gyra-grid-rail px-5 sm:px-8 py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#667085] mb-3">
                Get Started
              </p>
              <h2
                id="closing-cta-heading"
                className="font-display font-semibold text-[32px] sm:text-[42px] lg:text-[48px] tracking-[-0.035em] leading-[1.05] text-[#F5F7FA] [text-wrap:balance]"
              >
                Build, reason, and create on one intelligence layer.
              </h2>
            </div>
            <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3">
              <a
                href={resolveGyraRoute("/dashboard", routeBase)}
                className="inline-flex items-center justify-center gap-2 bg-[#F1F5F9] text-[#050608] hover:bg-white px-5 py-3 rounded-[4px] text-[14px] font-medium transition-colors"
              >
                Open Gyra
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href={resolveGyraRoute("/docs", routeBase)}
                className="inline-flex items-center justify-center gap-2 bg-[#050608] text-[#F5F7FA] border border-white/[0.14] hover:border-white/[0.28] px-5 py-3 rounded-[4px] text-[14px] font-medium transition-colors"
              >
                Read Documentation
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050608]">
        <div className="max-w-[1280px] mx-auto gyra-grid-rail px-5 sm:px-8 pt-16 pb-12">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-10 pb-14 border-b border-white/[0.08]">
            <div className="col-span-2 md:col-span-4">
              <a href={resolveGyraRoute("/", routeBase)} className="inline-flex items-center gap-2.5 mb-4">
                <img
                  src="/gyra-logo.png"
                  alt="Gyra"
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain"
                />
                <span className="font-display font-semibold text-[15px] text-[#F5F7FA]">
                  {GYRA_COMPANY.brand}
                </span>
              </a>
              <p className="text-[13px] text-[#8B94A6] leading-[1.6] max-w-[30ch] mb-5">
                {GYRA_COMPANY.tagline} Built by {GYRA_COMPANY.parentCompany}.
              </p>
              <a
                href={`mailto:${GYRA_COMPANY.emails.support}`}
                className="font-mono text-[12px] text-[#A0A8B8] hover:text-[#F5F7FA] transition-colors"
              >
                {GYRA_COMPANY.emails.support}
              </a>
            </div>

            <div className="col-span-1 md:col-span-2">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#F5F7FA] mb-4">
                Products
              </h3>
              <ul className="flex flex-col gap-2.5 text-[13px] text-[#8B94A6]">
                <li>
                  <a href={resolveGyraRoute("/dashboard", routeBase)} className="hover:text-[#F5F7FA] transition-colors">
                    Gyra Chat
                  </a>
                </li>
                <li>
                  <a href="#image" className="hover:text-[#F5F7FA] transition-colors">
                    Gyra Image
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/studio", routeBase)} className="hover:text-[#F5F7FA] transition-colors">
                    Gyra Video Studio
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/projects", routeBase)} className="hover:text-[#F5F7FA] transition-colors">
                    Projects
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/products", routeBase)} className="hover:text-[#F5F7FA] transition-colors">
                    All Products
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-1 md:col-span-2">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#F5F7FA] mb-4">
                Developers
              </h3>
              <ul className="flex flex-col gap-2.5 text-[13px] text-[#8B94A6]">
                <li>
                  <a href={resolveGyraRoute("/api", routeBase)} className="hover:text-[#F5F7FA] transition-colors">
                    API Overview
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/docs", routeBase)} className="hover:text-[#F5F7FA] transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/playground", routeBase)} className="hover:text-[#F5F7FA] transition-colors">
                    Playground
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/console", routeBase)} className="hover:text-[#F5F7FA] transition-colors">
                    Console
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/api-keys", routeBase)} className="hover:text-[#F5F7FA] transition-colors">
                    API Keys
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-1 md:col-span-2">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#F5F7FA] mb-4">
                Company
              </h3>
              <ul className="flex flex-col gap-2.5 text-[13px] text-[#8B94A6]">
                <li>
                  <a href={resolveGyraRoute("/about", routeBase)} className="hover:text-[#F5F7FA] transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/changelog", routeBase)} className="hover:text-[#F5F7FA] transition-colors">
                    Changelog
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/contact", routeBase)} className="hover:text-[#F5F7FA] transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/privacy", routeBase)} className="hover:text-[#F5F7FA] transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href={resolveGyraRoute("/terms", routeBase)} className="hover:text-[#F5F7FA] transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-1 md:col-span-2">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#F5F7FA] mb-4">
                Channels
              </h3>
              <ul className="flex flex-col gap-2.5 text-[13px] text-[#8B94A6]">
                {GYRA_COMPANY.socials.map((social) => (
                  <li key={social.id}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#F5F7FA] transition-colors"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-[11px] text-[#667085]">
            <p>© {GYRA_COMPANY.foundedYear} {GYRA_COMPANY.brand} · {GYRA_COMPANY.parentCompany}. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a
                href={resolveGyraRoute("/upgrade", routeBase)}
                className="hover:text-[#F5F7FA] transition-colors"
              >
                SuperGyra Plans
              </a>
              <a
                href={resolveGyraRoute("/status", routeBase)}
                className="hover:text-[#F5F7FA] transition-colors"
              >
                System Status
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
