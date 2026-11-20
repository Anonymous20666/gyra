"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Play, Pause } from "lucide-react";
import type { LabPalette } from "./labTheme";

type NodeId = "chat" | "image" | "video" | "api";

const NODES: Record<
  NodeId,
  {
    id: NodeId;
    label: string;
    sub: string;
    latency: string;
    route: string;
    steps: string[];
    outputTitle: string;
    outputBody: string;
  }
> = {
  chat: {
    id: "chat",
    label: "Gyra Chat",
    sub: "6-Agent Core",
    latency: "14ms TTFT",
    route: "POST /api/v1/chat",
    steps: [
      "01 Understand · Classified HMAC security + rate-limit constraints",
      "02 Orchestrate · Escalated to SuperGyra 2.0 + Sentinel QA",
      "03 Execute · Streamed verified handler with 300s replay guard",
    ],
    outputTitle: "Sentinel QA · Verified Handler",
    outputBody: `const ok = timingSafeEqual(sigBuf, expBuf);
if (!ok) return Response.json({ error: 401 }, { status: 401 });
return Response.json({ verified: true, agent: "SuperGyra 2.0" });`,
  },
  image: {
    id: "image",
    label: "Gyra Image",
    sub: "Pro Ultra I2I",
    latency: "2.1s render",
    route: "POST /api/fal/proxy",
    steps: [
      "01 Understand · Encoded 1440×1080 architectural geometry map",
      "02 Orchestrate · Selected Pro Ultra I2I with SSIM geometry lock",
      "03 Execute · Shifted exterior light to 2700K blue-hour dusk",
    ],
    outputTitle: "Pro Ultra · Geometry Locked (SSIM 0.994)",
    outputBody: "img-pair",
  },
  video: {
    id: "video",
    label: "Gyra Video",
    sub: "LTX-Video 13B",
    latency: "24 fps · 720p",
    route: "POST /api/v1/video/generate",
    steps: [
      "01 Understand · Anchored F001 Obsidian Studio Headset frame",
      "02 Orchestrate · Queued 121-frame 16:9 macro dolly motion pass",
      "03 Execute · Finalized H.264 stream with zero temporal flicker",
    ],
    outputTitle: "LTX-Video 13B · Obsidian Headset Loop",
    outputBody: "video-headset",
  },
  api: {
    id: "api",
    label: "Gyra API",
    sub: "OpenAI-Compat v1",
    latency: "11ms anycast",
    route: "https://gyra.ng/api/v1/*",
    steps: [
      "01 Understand · Validated category-scoped Bearer API key",
      "02 Orchestrate · Routed to nearest edge hub (LOS-01 / LHR-01)",
      "03 Execute · Opened HTTP/2 SSE stream with credit ledger guard",
    ],
    outputTitle: "200 OK · OpenAI-Compatible Stream",
    outputBody: `{
  "id": "chatcmpl-gyra-9a2f",
  "model": "gyra-super2.0",
  "edge": "LOS-01",
  "usage": { "tokens_per_sec": 118 }
}`,
  },
};

export function FlowSampleSynapticV3({ palette }: { palette: LabPalette }) {
  const [active, setActive] = useState<NodeId>("chat");
  const [auto, setAuto] = useState(true);
  const [pulsePhase, setPulsePhase] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeRef = useRef<NodeId>("chat");
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Smooth auto-cycle across the 4 live modalities (pauses cleanly on user hover/click or reduced motion)
  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const order: NodeId[] = ["chat", "image", "video", "api"];
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setActive((cur) => order[(order.indexOf(cur) + 1) % order.length]);
    }, 4400);
    return () => window.clearInterval(id);
  }, [auto]);

  // Crisp, wall-free floating synaptic signal canvas (compact 310px height so ENTIRE flow fits above the fold!)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const W = 680;
    const H = 310;
    canvas.width = W;
    canvas.height = H;

    const targets: { id: NodeId; x: number; y: number; label: string }[] = [
      { id: "chat", x: 105, y: 248, label: "CHAT" },
      { id: "image", x: 268, y: 248, label: "IMAGE" },
      { id: "video", x: 432, y: 248, label: "VIDEO" },
      { id: "api", x: 575, y: 248, label: "API" },
    ];

    let rafId = 0;
    let t = 0;
    let inView = true;

    const draw = () => {
      rafId = 0;
      if (document.hidden || !inView) return;
      if (!reducedMotion) t += 0.016;
      setPulsePhase(Math.floor((t * 30) % 100));

      ctx.clearRect(0, 0, W, H);
      const coreX = W * 0.5;
      const coreY = 104;
      const genviaY = 28;
      const curId = activeRef.current;

      // Top Genvia -> Gyra Core tether
      ctx.strokeStyle = `rgba(${palette.brightRgb}, 0.5)`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(coreX, genviaY + 12);
      ctx.lineTo(coreX, coreY - 26);
      ctx.stroke();

      // Traveling drop packet Genvia -> Core
      const dropY = genviaY + 12 + ((t * 0.8) % 1) * (coreY - genviaY - 38);
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(coreX, dropY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw curved conduits from Gyra Core -> 4 Modality Runners
      for (const n of targets) {
        const isAct = n.id === curId;
        const cx = (coreX + n.x) * 0.5;
        const cy = coreY + 72;

        ctx.strokeStyle = isAct ? palette.bright : "rgba(255,255,255,0.14)";
        ctx.lineWidth = isAct ? 2.2 : 1.0;
        ctx.beginPath();
        ctx.moveTo(coreX, coreY + 26);
        ctx.quadraticCurveTo(cx, cy, n.x, n.y - 20);
        ctx.stroke();

        // Luminous traveling signal along active branch
        if (isAct) {
          for (let k = 0; k < 2; k++) {
            const p = (t * 0.65 + k * 0.5) % 1;
            const u = 1 - p;
            const px = u * u * coreX + 2 * u * p * cx + p * p * n.x;
            const py = u * u * (coreY + 26) + 2 * u * p * cy + p * p * (n.y - 20);

            const g = ctx.createRadialGradient(px, py, 0, px, py, 12);
            g.addColorStop(0, "#FFFFFF");
            g.addColorStop(0.4, palette.bright);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(px, py, 12, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Modality node orb
        ctx.fillStyle = isAct ? palette.solid : "#070A0F";
        ctx.strokeStyle = isAct ? "#FFFFFF" : "rgba(255,255,255,0.22)";
        ctx.lineWidth = isAct ? 1.8 : 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, isAct ? 22 : 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isAct ? "#FFFFFF" : "#8DA2B5";
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText(n.label, n.x, n.y + 3.5);
      }

      // Central Gyra Core Orb
      const cg = ctx.createRadialGradient(coreX, coreY, 4, coreX, coreY, 54);
      cg.addColorStop(0, `rgba(${palette.brightRgb}, 0.45)`);
      cg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(coreX, coreY, 54, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#040910";
      ctx.strokeStyle = palette.bright;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(coreX, coreY, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("GYRA", coreX, coreY + 4);

      // Top Genvia pill
      ctx.fillStyle = "#8DA2B5";
      ctx.font = '500 9.5px "JetBrains Mono", monospace';
      ctx.fillText("GENVIA AI", coreX, genviaY);

      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(draw);
      }
    };

    const io = new IntersectionObserver((entries) => {
      inView = entries.some((e) => e.isIntersecting);
      if (inView && !rafId) rafId = window.requestAnimationFrame(draw);
    });
    io.observe(canvas);
    rafId = window.requestAnimationFrame(draw);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      io.disconnect();
    };
  }, [palette.bright, palette.brightRgb, palette.solid]);

  const item = NODES[active];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono-tech text-[11px] tracking-[0.16em] uppercase" style={{ color: palette.bright }}>
            [ SYNAPTIC NEURAL ENGINE V3 · ZERO SKELETONS · FITS ABOVE FOLD ]
          </p>
          <h2 className="font-display mt-2.5 text-[clamp(2.2rem,3.8vw,3.3rem)] leading-[0.96] tracking-[-0.02em] text-white uppercase">
            <span className="font-light text-white/75">Your synaptic topology,</span>{" "}
            <span className="font-bold text-white">wall-free &amp; instant.</span>
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setAuto((v) => !v)}
          className="font-mono-tech inline-flex min-h-[34px] items-center gap-1.5 border border-white/15 bg-black px-3 text-[10.5px] uppercase text-[#B8CAD8] hover:border-white hover:text-white cursor-pointer"
        >
          {auto ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          <span>{auto ? "Auto-Flow" : "Manual"}</span>
        </button>
      </div>

      {/* Above-the-Fold 2-Column Split: Floating Canvas Left + Instant Live Output Right (Zero Nested Walls!) */}
      <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <canvas
            ref={canvasRef}
            aria-label="Upgraded wall-free Gyra Synaptic Neural Flow canvas"
            className="mx-auto block w-full max-w-[680px]"
          />
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {(["chat", "image", "video", "api"] as const).map((id) => {
              const isAct = id === active;
              return (
                <button
                  key={id}
                  type="button"
                  onMouseEnter={() => {
                    setAuto(false);
                    setActive(id);
                  }}
                  onClick={() => {
                    setAuto(false);
                    setActive(id);
                  }}
                  style={{
                    borderColor: isAct ? palette.bright : "rgba(255,255,255,0.14)",
                    backgroundColor: isAct ? `rgba(${palette.rgb}, 0.25)` : "transparent",
                  }}
                  className="font-mono-tech border px-3.5 py-1.5 text-[10.5px] tracking-[0.08em] text-white uppercase transition-colors cursor-pointer"
                >
                  {NODES[id].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 6 cols: Instant Live Result Viewport (Zero Empty Grey Skeleton Bars!) */}
        <div className="border-l border-white/12 pl-0 lg:col-span-6 lg:pl-8">
          <div className="flex items-center justify-between font-mono-tech text-[10.5px] uppercase">
            <span style={{ color: palette.bright }}>{item.route}</span>
            <span className="text-[#34D399]">{item.latency} · LIVE {pulsePhase}%</span>
          </div>

          <h3 className="mt-2 text-[22px] font-semibold text-white">{item.outputTitle}</h3>

          <ul className="mt-4 space-y-2 border-y border-white/10 py-3.5 font-mono-tech text-[11px] text-[#9BB0C2]">
            {item.steps.map((s) => (
              <li key={s} className="flex items-start gap-2">
                <span className="text-[#34D399]">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5">
            {item.outputBody === "img-pair" ? (
              <div className="grid grid-cols-2 gap-3">
                <img
                  src="/showcase/edit-before.webp"
                  alt="Before daylight"
                  className="aspect-[16/10] w-full border border-white/12 object-cover"
                />
                <img
                  src="/showcase/edit-after.webp"
                  alt="After 2700K dusk relight"
                  className="aspect-[16/10] w-full border border-[#34D399]/50 object-cover"
                />
              </div>
            ) : item.outputBody === "video-headset" ? (
              <video
                src="/products-hero-bg.mp4"
                poster="/video-samples/headset-f001.webp"
                autoPlay
                muted
                loop
                playsInline
                className="aspect-[16/9] w-full border border-white/12 object-cover"
              />
            ) : (
              <pre
                tabIndex={0}
                role="region"
                aria-label={item.outputTitle}
                className="overflow-x-auto bg-[#04070C] p-4 font-mono-tech text-[11.5px] leading-[1.65] text-[#DCE8F4]"
              >
                <code>{item.outputBody}</code>
              </pre>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between font-mono-tech text-[11px] uppercase">
            <span className="text-[#788D9F]">Hover any modality pill above to switch instantly</span>
            <a href="/dashboard" className="inline-flex items-center gap-1 text-white hover:underline">
              Open <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
