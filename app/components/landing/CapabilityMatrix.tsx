"use client";

import { useState } from "react";

export function CapabilityMatrix() {
  const [activeEndpoint, setActiveEndpoint] = useState<0 | 1 | 2>(0);

  const routes = [
    { method: "POST", path: "/api/v1/chat", target: "gyra-super2.0 · sse" },
    { method: "POST", path: "/api/v1/video/generate", target: "ltx-13b · async" },
    { method: "GET", path: "/api/v1/media/youtube/transcript", target: "media · $0.90/req" },
  ];

  return (
    <section className="border-b border-[#1F1F1F] bg-black py-24 lg:py-32">
      <div className="mx-auto max-w-[1380px] px-5 sm:px-8">
        <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-mono-tech text-[12px] tracking-[0.14em] text-[#8A8A8A] uppercase">
              [ Platform Primitives ]
            </p>
            <h2 className="font-display mt-3.5 text-[clamp(2.35rem,4.2vw,3.75rem)] font-bold leading-[0.98] tracking-[-0.02em] text-white uppercase [text-wrap:balance]">
              Everything an AI platform needs under one roof.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-6">
            <p className="text-[15px] leading-[1.65] text-[#9A9A9A]">
              Execution sandboxes, file-grounded RAG projects, REST routing, live multi-channel
              streaming, and scoped API credentials — built into one coherent stack.
            </p>
          </div>
        </div>

        {/* Seamless 1px Border-Collapsed Architectural Matrix (E2B Standard) */}
        <div className="mt-12 border border-[#1F1F1F]">
          {/* Top Row: 2 Equal Architectural Cells */}
          <div className="grid grid-cols-1 divide-y divide-[#1F1F1F] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            {/* Cell 1: Forge Sandbox Execution */}
            <div className="flex flex-col justify-between bg-black p-6 sm:p-8">
              <div className="border border-[#1F1F1F] bg-[#040404]">
                <div className="flex items-center justify-between border-b border-[#191919] px-4 py-2.5 font-mono-tech text-[11px] text-[#737373]">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 border border-[#444444]" />
                    <span className="h-2 w-2 border border-[#444444]" />
                  </span>
                  <span>FORGE · /workspace/gyra-app</span>
                </div>
                <div className="min-h-[168px] p-5 font-mono-tech text-[13px] leading-[1.8]">
                  <div className="text-white">
                    <span className="text-[#808080]">&gt; </span>
                    gyra forge run --verify
                    <span className="gyra-cursor ml-1.5" aria-hidden="true" />
                  </div>
                  <div className="mt-4 space-y-2.5">
                    <div className="h-[1px] w-3/4 bg-[#1E1E1E]" />
                    <div className="h-[1px] w-1/2 bg-[#1E1E1E]" />
                    <div className="flex items-center justify-between pt-2 text-[11px] text-[#808080]">
                      <span>isolated linux terminal · preview</span>
                      <span className="text-[#3B82F6]">exit 0</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-7">
                <h3 className="text-[16px] font-semibold text-white">Forge Coding Preview</h3>
                <p className="mt-1 text-[14px] text-[#8A8A8A]">
                  Autonomous coding workspace with an isolated Linux shell and iterative file tools.
                </p>
              </div>
            </div>

            {/* Cell 2: Interactive Endpoint Routing */}
            <div className="flex flex-col justify-between bg-black p-6 sm:p-8">
              <div className="space-y-3">
                {routes.map((route, idx) => {
                  const active = activeEndpoint === idx;
                  return (
                    <button
                      key={route.path}
                      type="button"
                      onClick={() => setActiveEndpoint(idx as 0 | 1 | 2)}
                      className="grid w-full grid-cols-12 items-center text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3B82F6]"
                    >
                      <span
                        className={`font-mono-tech col-span-3 border px-3 py-2.5 text-[11px] uppercase transition-colors ${
                          active
                            ? "border-[#383838] text-white"
                            : "border-[#1F1F1F] text-[#737373] hover:text-[#CCCCCC]"
                        }`}
                      >
                        {route.method}
                      </span>
                      <span
                        className={`col-span-1 h-[1px] transition-colors ${
                          active ? "bg-[#2563EB]" : "bg-[#242424]"
                        }`}
                        aria-hidden="true"
                      />
                      <span
                        className={`font-mono-tech col-span-8 flex items-center justify-between border px-3.5 py-2.5 text-[11px] transition-colors ${
                          active
                            ? "border-[#3B82F6] bg-[#2563EB]/12 text-white"
                            : "border-[#1F1F1F] bg-black text-[#737373] hover:text-[#CCCCCC]"
                        }`}
                      >
                        <span className="truncate">{route.path}</span>
                        <span
                          className={`ml-2 hidden shrink-0 text-[10px] sm:inline ${
                            active ? "text-[#3B82F6]" : "text-[#555555]"
                          }`}
                        >
                          {route.target}
                        </span>
                      </span>
                    </button>
                  );
                })}

                <div className="mt-4 grid grid-cols-12 border-t border-[#1A1A1A] pt-3.5 font-mono-tech text-[11px]">
                  <span className="col-span-3 text-[#666666] uppercase">Policy</span>
                  <div className="col-span-9 space-y-1">
                    <div className="flex gap-4">
                      <span className="text-white">allow</span>
                      <span className="text-[#8A8A8A]">gyra.ng/api/v1/*</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-[#737373]">guard</span>
                      <span className="text-[#666666]">rate-limit + bearer scope</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-7">
                <h3 className="text-[16px] font-semibold text-white">Unified API Routing</h3>
                <p className="mt-1 text-[14px] text-[#8A8A8A]">
                  OpenAI-compatible chat, async video queues, and media intelligence behind one base URL.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Row: 3 Architectural Schematic Cells */}
          <div className="grid grid-cols-1 divide-y divide-[#1F1F1F] border-t border-[#1F1F1F] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {/* Cell 3: Projects RAG File Tree */}
            <div className="flex flex-col justify-between bg-black p-6 sm:p-8">
              <div className="font-mono-tech text-[12px] leading-[2]">
                <div className="text-[#666666]">/projects/q2-architecture</div>
                <div className="border-l border-[#242424] pl-4">
                  <div className="text-[#CCCCCC]">docs/</div>
                  <div className="border-l border-[#242424] pl-4">
                    <div className="text-[#8A8A8A]">system-spec.pdf</div>
                    <div className="flex items-center justify-between text-white">
                      <span>webhook-schema.ts</span>
                      <span className="text-[10px] text-[#3B82F6]">INDEXED</span>
                    </div>
                    <div className="text-[#8A8A8A]">pricing-matrix.csv</div>
                  </div>
                  <div className="mt-2 text-[11px] text-[#666666]">
                    share → viewer / editor link
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-[16px] font-semibold text-white">Projects RAG Storage</h3>
                <p className="mt-1 text-[14px] text-[#8A8A8A]">
                  Ground threads in uploaded PDFs, codebases, and notes with shareable links.
                </p>
              </div>
            </div>

            {/* Cell 4: Live Multi-Channel Stream Polyline */}
            <div className="flex flex-col justify-between bg-black p-6 sm:p-8">
              <div className="relative pt-4">
                <div className="mb-2 flex items-center justify-end">
                  <span className="font-mono-tech border border-[#2A2A2A] bg-black px-2 py-0.5 text-[10px] text-white">
                    SSE STREAM · LIVE
                  </span>
                </div>
                <svg
                  viewBox="0 0 320 120"
                  className="h-[120px] w-full overflow-visible"
                  role="img"
                  aria-label="Streaming token throughput curve across web and Telegram channels"
                >
                  <line x1="0" y1="24" x2="320" y2="24" stroke="#181818" strokeWidth="1" />
                  <line x1="0" y1="60" x2="320" y2="60" stroke="#181818" strokeWidth="1" />
                  <line x1="0" y1="96" x2="320" y2="96" stroke="#1F1F1F" strokeWidth="1" />
                  <polyline
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="1.6"
                    points="0,92 32,76 64,84 96,46 128,68 160,52 192,78 224,28 256,64 288,42 320,34"
                  />
                  <circle cx="224" cy="28" r="3.5" fill="#000000" stroke="#3B82F6" strokeWidth="1.8" />
                </svg>
              </div>

              <div className="mt-6">
                <h3 className="text-[16px] font-semibold text-white">Multi-Channel Delivery</h3>
                <p className="mt-1 text-[14px] text-[#8A8A8A]">
                  Real-time SSE responses across Web, Android, and @Gyra_AiBot on Telegram.
                </p>
              </div>
            </div>

            {/* Cell 5: Scoped Keys & Auth Boundary */}
            <div className="flex flex-col justify-between bg-black p-6 sm:p-8">
              <div className="flex flex-col items-center">
                <div className="w-full border border-[#262626] bg-[#040404] p-4 font-mono-tech text-[11px]">
                  <p className="text-[10px] tracking-[0.1em] text-[#666666] uppercase">
                    Client Request
                  </p>
                  <p className="mt-1.5 text-white">POST /api/v1/chat</p>
                  <p className="mt-1 text-[#8A8A8A]">Authorization: Bearer $GYRA_KEY</p>
                </div>
                <div className="h-7 w-[1px] bg-[#2563EB]" aria-hidden="true" />
                <div className="w-full border border-[#3B82F6]/60 bg-black px-4 py-2.5 font-mono-tech text-[10px] tracking-[0.08em] text-[#D4D4D4] uppercase">
                  Server-verified scope · wallet balance ok
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-[16px] font-semibold text-white">Scoped Keys & Credits</h3>
                <p className="mt-1 text-[14px] text-[#8A8A8A]">
                  Category-scoped API keys, strict proxy authentication, and transparent usage wallets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
