"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy, Terminal } from "lucide-react";
import {
  API_EXAMPLES,
  resolveGyraRoute,
  type ApiEndpointId,
  type CodeLanguage,
} from "../../lib/landingSimulations";
import { usePointerBorder } from "./usePointerBorder";

interface DeveloperQuickstartProps {
  routeBase?: string;
}

const LANGUAGES: { id: CodeLanguage; label: string }[] = [
  { id: "typescript", label: "TypeScript" },
  { id: "curl", label: "cURL" },
  { id: "python", label: "Python" },
];

export function DeveloperQuickstart({ routeBase = "" }: DeveloperQuickstartProps) {
  const [endpointId, setEndpointId] = useState<ApiEndpointId>("chat");
  const [language, setLanguage] = useState<CodeLanguage>("typescript");
  const [copied, setCopied] = useState<boolean>(false);
  const pointer = usePointerBorder<HTMLDivElement>();

  const activeExample = API_EXAMPLES.find((e) => e.id === endpointId) ?? API_EXAMPLES[0];
  const activeCode = activeExample.snippets[language];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      id="developers"
      aria-labelledby="developers-heading"
      className="bg-[#0B0D11] border-b border-white/[0.08] scroll-mt-16"
    >
      <div className="max-w-[1280px] mx-auto gyra-grid-rail px-5 sm:px-8 py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-12">
          <div className="lg:col-span-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#67E8F9] mb-3">
              05 / Developer Platform
            </p>
            <h2
              id="developers-heading"
              className="font-display font-semibold text-[30px] sm:text-[38px] lg:text-[42px] tracking-[-0.03em] leading-[1.08] text-[#F5F7FA] [text-wrap:balance]"
            >
              Drop-in endpoints for every Gyra capability.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-6">
            <p className="text-[15px] text-[#A0A8B8] leading-[1.65] mb-4">
              Integrate Gyra Chat, asynchronous video generation, voice synthesis, and media
              intelligence with category-scoped keys, server-side rate limiting, and an interactive
              Playground.
            </p>
            <div className="flex flex-wrap items-center gap-5 text-[13px] font-medium">
              <a
                href={resolveGyraRoute("/docs", routeBase)}
                className="inline-flex items-center gap-1 text-[#F5F7FA] hover:text-[#67E8F9] transition-colors"
              >
                Documentation
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
              <a
                href={resolveGyraRoute("/playground", routeBase)}
                className="inline-flex items-center gap-1 text-[#A0A8B8] hover:text-[#F5F7FA] transition-colors"
              >
                Playground
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
              <a
                href={resolveGyraRoute("/api-keys", routeBase)}
                className="inline-flex items-center gap-1 text-[#A0A8B8] hover:text-[#F5F7FA] transition-colors"
              >
                API Keys
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
              <a
                href={resolveGyraRoute("/console", routeBase)}
                className="inline-flex items-center gap-1 text-[#A0A8B8] hover:text-[#F5F7FA] transition-colors"
              >
                Console
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* Code + Response Workbench */}
        <div
          {...pointer}
          className="gyra-frame gyra-frame-interactive rounded-[6px] overflow-hidden bg-[#07090D]"
        >
          {/* Endpoint Selector & Language Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-3.5 bg-[#0E1117] border-b border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="API Endpoints">
              {API_EXAMPLES.map((example) => {
                const active = example.id === activeExample.id;
                return (
                  <button
                    key={example.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setEndpointId(example.id)}
                    className={`px-3 py-1.5 rounded-[4px] text-[12px] font-medium transition-colors ${
                      active
                        ? "bg-[#181D27] text-[#F5F7FA] border border-white/[0.14]"
                        : "text-[#8B94A6] hover:text-[#F5F7FA] border border-transparent"
                    }`}
                  >
                    {example.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div
                className="inline-flex bg-[#050608] border border-white/[0.1] rounded-[4px] p-0.5"
                role="group"
                aria-label="Code language"
              >
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    aria-pressed={language === lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`px-2.5 py-1 rounded-[3px] font-mono text-[11px] transition-colors ${
                      language === lang.id
                        ? "bg-[#181D27] text-[#67E8F9]"
                        : "text-[#8B94A6] hover:text-[#F5F7FA]"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-white/[0.12] bg-[#0B0D11] font-mono text-[11px] text-[#C5CBD6] hover:text-[#F5F7FA] transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#5EEAD4]" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Endpoint Path Banner */}
          <div className="px-5 py-2.5 bg-[#090B0F] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
            <div className="flex items-center gap-2.5">
              <span className="text-[#67E8F9] font-medium">{activeExample.method}</span>
              <span className="text-[#F5F7FA]">{activeExample.endpoint}</span>
            </div>
            <span className="text-[#667085]">{activeExample.authNote}</span>
          </div>

          {/* Request & Response Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
            <div className="lg:col-span-7 bg-[#050608] p-5">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#667085] mb-3">
                <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
                Request ({language})
              </div>
              <pre className="text-[12px] sm:text-[13px] font-mono text-[#DCE2EC] leading-[1.65] overflow-x-auto gyra-scroll">
                <code>{activeCode}</code>
              </pre>
            </div>

            <div className="lg:col-span-5 bg-[#080A0E] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-[#667085] mb-3">
                  <span>Response Payload</span>
                  <span className="text-[#5EEAD4]">200 OK · JSON</span>
                </div>
                <pre className="text-[12px] font-mono text-[#A0A8B8] leading-[1.65] overflow-x-auto gyra-scroll">
                  <code>{activeExample.sampleResponse}</code>
                </pre>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#667085]">
                  Test live requests in browser
                </span>
                <a
                  href={resolveGyraRoute("/playground", routeBase)}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-[#F5F7FA] hover:text-[#67E8F9] transition-colors"
                >
                  Open Playground
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
