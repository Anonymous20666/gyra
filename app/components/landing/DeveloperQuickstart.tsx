"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import {
  API_EXAMPLES,
  resolveGyraRoute,
  type CodeLanguage,
} from "../../lib/landingSimulations";

export interface DeveloperQuickstartProps {
  routeBase?: string;
}

const LANGUAGES: { id: CodeLanguage; label: string }[] = [
  { id: "typescript", label: "TypeScript" },
  { id: "curl", label: "cURL" },
  { id: "python", label: "Python" },
];

export function DeveloperQuickstart({ routeBase = "" }: DeveloperQuickstartProps) {
  const [endpointId, setEndpointId] = useState(API_EXAMPLES[0].id);
  const [language, setLanguage] = useState<CodeLanguage>("typescript");
  const [copied, setCopied] = useState(false);

  const activeExample =
    API_EXAMPLES.find((ex) => ex.id === endpointId) ?? API_EXAMPLES[0];
  const activeCode = activeExample.snippets[language];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
    } catch {
      // Clipboard fallback ignored
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section
      id="developers"
      className="gyra-band-defer border-b border-[#1F1F1F] bg-black py-24 lg:py-32"
    >
      <div className="mx-auto max-w-[1380px] px-5 sm:px-8">
        {/* Header Row */}
        <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-mono-tech text-[12px] tracking-[0.14em] text-[#5B9EC2] uppercase">
              [ 04 · Developer Platform ]
            </p>
            <h2 className="font-display mt-3.5 text-[clamp(2.35rem,4.2vw,3.75rem)] font-bold leading-[0.98] tracking-[-0.02em] text-white uppercase [text-wrap:balance]">
              Drop-in endpoints for every Gyra capability.
            </h2>
          </div>

          <div className="lg:col-span-5 lg:pl-6">
            <p className="text-[15px] leading-[1.65] text-[#9A9A9A]">
              Integrate Gyra Chat, async video generation, voice synthesis, and media extraction
              using category-scoped keys, server-side rate limits, and a live Playground.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono-tech text-[11px] tracking-[0.08em] uppercase">
              {[
                { label: "Docs", href: "/docs" },
                { label: "Playground", href: "/playground" },
                { label: "API Keys", href: "/api-keys" },
                { label: "Console", href: "/console" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={resolveGyraRoute(link.href, routeBase)}
                  className="inline-flex items-center gap-1 text-white underline decoration-[#303030] underline-offset-4 transition-colors hover:text-[#5B9EC2] hover:decoration-[#5B9EC2]"
                >
                  {link.label}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Pitch-Black API Console */}
        <div className="mt-12 border border-[#1F1F1F] bg-black">
          {/* Endpoint + Language Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1F1F1F] bg-[#050505] px-4 py-3 sm:px-5">
            <div role="tablist" aria-label="API Endpoints" className="flex flex-wrap gap-1.5">
              {API_EXAMPLES.map((item) => {
                const selected = item.id === activeExample.id;
                return (
                  <button
                    key={item.id}
                    id={`gyra-api-tab-${item.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls="gyra-api-tabpanel"
                    onClick={() => setEndpointId(item.id)}
                    className={`font-mono-tech min-h-[34px] border px-3 text-[11px] tracking-[0.06em] uppercase transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2] ${
                      selected
                        ? "border-[#5B9EC2] bg-[#1F5B7C] font-medium text-white"
                        : "border-[#242424] bg-black text-[#8A8A8A] hover:border-[#444] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5">
              <div role="group" aria-label="Code language" className="inline-flex border border-[#242424]">
                {LANGUAGES.map((lang, idx) => (
                  <button
                    key={lang.id}
                    type="button"
                    aria-pressed={language === lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`font-mono-tech min-h-[32px] px-3 text-[11px] uppercase transition-colors ${
                      idx > 0 ? "border-l border-[#242424]" : ""
                    } ${
                      language === lang.id
                        ? "bg-white font-medium text-black"
                        : "bg-black text-[#8A8A8A] hover:text-white"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="font-mono-tech inline-flex min-h-[32px] items-center gap-1.5 border border-[#262626] bg-black px-3 text-[11px] tracking-[0.06em] text-[#D4D4D4] uppercase hover:border-white hover:text-white"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-[#5B9EC2]" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Endpoint Contract Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A] bg-black px-5 py-3 font-mono-tech text-[12px]">
            <div className="flex items-center gap-2.5">
              <span className="bg-[#1F5B7C] px-2 py-0.5 text-[10px] font-medium text-white">
                {activeExample.method}
              </span>
              <span className="text-white">{activeExample.endpoint}</span>
            </div>
            <span className="text-[11px] text-[#737373]">{activeExample.authNote}</span>
          </div>

          {/* Split Code + Response */}
          <div
            id="gyra-api-tabpanel"
            role="tabpanel"
            aria-labelledby={`gyra-api-tab-${activeExample.id}`}
            className="grid grid-cols-1 divide-y divide-[#1F1F1F] lg:grid-cols-12 lg:divide-x lg:divide-y-0"
          >
            <div className="bg-[#030303] p-5 sm:p-6 lg:col-span-7">
              <p
                id="gyra-api-request-caption"
                className="font-mono-tech mb-3 text-[10px] tracking-[0.12em] text-[#737373] uppercase"
              >
                Request ({language})
              </p>
              <pre
                role="region"
                aria-labelledby="gyra-api-request-caption"
                tabIndex={0}
                className="overflow-x-auto font-mono-tech text-[12px] leading-[1.7] text-[#E5E5E5] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2]"
              >
                <code>{activeCode}</code>
              </pre>
            </div>

            <div className="flex flex-col justify-between bg-black p-5 sm:p-6 lg:col-span-5">
              <div>
                <div className="mb-3 flex items-center justify-between font-mono-tech text-[10px] tracking-[0.12em] uppercase">
                  <span id="gyra-api-response-caption" className="text-[#737373]">
                    Response Payload
                  </span>
                  <span className="text-[#5B9EC2]">200 OK · JSON</span>
                </div>
                <pre
                  role="region"
                  aria-labelledby="gyra-api-response-caption"
                  tabIndex={0}
                  className="overflow-x-auto border border-[#1A1A1A] bg-[#040404] p-4 font-mono-tech text-[12px] leading-[1.65] text-[#CCCCCC] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2]"
                >
                  <code>{activeExample.sampleResponse}</code>
                </pre>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#1A1A1A] pt-4 font-mono-tech text-[11px]">
                <span className="text-[#737373] uppercase">Test live in browser</span>
                <a
                  href={resolveGyraRoute("/playground", routeBase)}
                  className="inline-flex items-center gap-1 text-white uppercase hover:text-[#5B9EC2]"
                >
                  Open Playground
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
