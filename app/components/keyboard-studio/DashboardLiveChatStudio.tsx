"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Download,
  Image as ImageIcon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Sparkles,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  Zap,
} from "lucide-react";
import type { ChatFlowPhase, LiveModalityId } from "./SynapticKeyboardCanopy";

export interface ModalityScript {
  id: LiveModalityId;
  code: string;
  label: string;
  shortLabel: string;
  threadTitle: string;
  prompt: string;
  dropLabel: string;
  reasoningSteps: string[];
  searchLabel: string;
  sources: { domain: string }[];
  agentName: string;
  agentStatus: string;
  streamText: string;
}

export const MODALITY_SCRIPTS: Record<LiveModalityId, ModalityScript> = {
  chat: {
    id: "chat",
    code: "01",
    label: "CHAT",
    shortLabel: "CHAT",
    threadTitle: "Tokyo vs Lisbon Shoot Plan",
    prompt: "Compare Tokyo vs Lisbon for a 5-day product shoot: weather, flight cost & golden hour",
    dropLabel: "Tokyo vs Lisbon Gen UI",
    reasoningSteps: [
      "Comparing 5-day autumn weather reliability, flight medians & sunset azimuth...",
      "Structuring interactive budget breakdown & golden-hour comparison Gen UI...",
    ],
    searchLabel: "Searching climate, flight & studio rate indexes...",
    sources: [{ domain: "W" }, { domain: "F" }, { domain: "S" }, { domain: "L" }, { domain: "T" }, { domain: "G" }],
    agentName: "SuperGyra 2.0",
    agentStatus: "Composing interactive Gen UI comparison cards...",
    streamText:
      "Lisbon gives you 3°C warmer skies, a later 18:42 golden hour, and saves $740 across flights and loft rental compared to Tokyo.",
  },
  image: {
    id: "image",
    code: "02",
    label: "IMAGE",
    shortLabel: "IMAGE",
    threadTitle: "2700K Studio Loft Relight",
    prompt: "Relight this concrete studio loft to warm 2700K dusk while locking every object in place",
    dropLabel: "2700K Relight",
    reasoningSteps: [
      "Extracting 16-bit architectural depth normals & desk-lamp light vector...",
      "Routing to Gyra Pro Ultra I2I with SSIM structural lock enabled...",
    ],
    searchLabel: "Authenticating /api/fal/proxy & loading reference frame...",
    sources: [{ domain: "P" }, { domain: "D" }, { domain: "G" }],
    agentName: "Pro Ultra I2I",
    agentStatus: "Synthesizing warm 2700K tungsten bounce over blue-hour glass...",
    streamText:
      "Relight complete with 0.994 structural fidelity — every wall, frame, and desk surface stayed locked while shifting window light to twilight.",
  },
  video: {
    id: "video",
    code: "03",
    label: "VIDEO",
    shortLabel: "VIDEO",
    threadTitle: "Obsidian Headset 720p Orbit",
    prompt: "Generate a 720p 24fps macro rim-light orbit around the obsidian studio headphones",
    dropLabel: "LTX-Video 13B · 720p",
    reasoningSteps: [
      "Locking Frame 001 obsidian rim-light silhouette & 85mm shallow depth...",
      "Scheduling 121-frame temporal motion synthesis on LTX-Video 13B...",
    ],
    searchLabel: "Allocating async 24fps cinema worker & motion anchor...",
    sources: [{ domain: "L" }, { domain: "F" }, { domain: "S" }],
    agentName: "LTX-Video 13B",
    agentStatus: "Rendering 121 coherent frames at 720p · 24 fps...",
    streamText:
      "Rendered a smooth 5.0-second 720p studio orbit with zero temporal flicker and locked anodized highlights.",
  },
  audio: {
    id: "audio",
    code: "04",
    label: "AUDIO",
    shortLabel: "AUDIO",
    threadTitle: "Executive Launch Voice Brief",
    prompt: "Turn our Q4 launch summary into a crisp 48kHz executive voice brief with transcript",
    dropLabel: "Gyra Voice · 48kHz TTS",
    reasoningSteps: [
      "Structuring natural cadence, breathing pauses & emphasis markers...",
      "Synthesizing 48kHz Gyra Nova vocal track & Whisper v3 word timestamps...",
    ],
    searchLabel: "Loading Gyra Nova neural voice model & Whisper v3 aligner...",
    sources: [{ domain: "V" }, { domain: "W" }, { domain: "A" }],
    agentName: "Gyra Voice",
    agentStatus: "Encoding 48kHz neural audio waveform & synced transcript...",
    streamText:
      "Your 12-second executive voice brief is ready in 48kHz studio clarity with synced Whisper v3 captions below.",
  },
};

export const MODALITY_ORDER: LiveModalityId[] = ["chat", "image", "video", "audio"];

export interface DashboardLiveChatStudioProps {
  activeModality: LiveModalityId;
  phase: ChatFlowPhase;
  typedComposerText: string;
  userPrompt: string;
  autoFlow: boolean;
  onSelectModality: (m: LiveModalityId, fromScroll?: boolean) => void;
  onToggleAutoFlow: () => void;
  onReplay: () => void;
}

const WAVEFORM_BARS = [
  24, 46, 34, 68, 82, 54, 92, 74, 42, 62, 88, 96, 60, 48, 78, 86, 52, 66, 90, 72, 44, 58, 80, 64,
  38, 52, 40, 28,
];

export function DashboardLiveChatStudio({
  activeModality,
  phase,
  typedComposerText,
  userPrompt,
  autoFlow,
  onSelectModality,
  onToggleAutoFlow,
  onReplay,
}: DashboardLiveChatStudioProps) {
  const activeScript = MODALITY_SCRIPTS[activeModality];

  const scrollerRef = useRef<HTMLDivElement>(null);
  const programmaticScrollUntilRef = useRef(0);
  const scrollDebounceRef = useRef<number | null>(null);

  const [selectedModel, setSelectedModel] = useState<"gyra-super2.0" | "gyra-1.0">("gyra-super2.0");
  const [selectedCity, setSelectedCity] = useState<"lisbon" | "tokyo">("lisbon");
  const [planLocked, setPlanLocked] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const [videoFrame, setVideoFrame] = useState(1);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(34);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [liked, setLiked] = useState<"up" | "down" | null>(null);
  const [thinkingSecs, setThinkingSecs] = useState(1);

  const audioTimerRef = useRef<number | null>(null);

  // Softly scroll the locked internal viewport whenever activeModality changes from Auto-Flow, Tabs, Canopy, or Top Prompt Bar!
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = MODALITY_ORDER.indexOf(activeModality);
    const slideH = el.clientHeight;
    if (slideH <= 0) return;
    const targetTop = idx * slideH;
    if (Math.abs(el.scrollTop - targetTop) > 12) {
      programmaticScrollUntilRef.current = performance.now() + 650;
      el.scrollTo({ top: targetTop, behavior: "smooth" });
    }
  }, [activeModality]);

  // Detect user's own smooth scrolling inside the locked box and sync tab + 21-orb canopy cleanly!
  const handleInternalScroll = () => {
    if (performance.now() < programmaticScrollUntilRef.current) return;
    const el = scrollerRef.current;
    if (!el || el.clientHeight <= 0) return;

    if (scrollDebounceRef.current) window.clearTimeout(scrollDebounceRef.current);
    scrollDebounceRef.current = window.setTimeout(() => {
      const idx = Math.max(
        0,
        Math.min(MODALITY_ORDER.length - 1, Math.round(el.scrollTop / Math.max(1, el.clientHeight))),
      );
      const nextModality = MODALITY_ORDER[idx];
      if (nextModality && nextModality !== activeModality) {
        onSelectModality(nextModality, true);
      }
    }, 110);
  };

  useEffect(() => {
    return () => {
      if (scrollDebounceRef.current) window.clearTimeout(scrollDebounceRef.current);
    };
  }, []);

  // Reset per-run visual states cleanly whenever a new run starts
  useEffect(() => {
    if (phase === "typing" || phase === "routing") {
      setStreamedWords(0);
      setThinkingSecs(1);
      setPlanLocked(false);
      setLiked(null);
      setAudioPlaying(false);
      setAudioProgress(22);
      setVideoFrame(1);
    }
  }, [phase, activeModality]);

  // Increment "Thinking for 1s -> 2s" organically during processing phases
  useEffect(() => {
    if (phase === "thinking") {
      setThinkingSecs(1);
      const id = window.setTimeout(() => setThinkingSecs(2), 660);
      return () => window.clearTimeout(id);
    }
    if (phase === "searching" || phase === "streaming" || phase === "done") {
      setThinkingSecs(2);
    }
  }, [phase]);

  // Lazy, natural word-by-word prose streaming strictly once phase enters "streaming" or "done"
  const [streamedWords, setStreamedWords] = useState(0);
  useEffect(() => {
    const words = activeScript.streamText.split(" ");
    if (phase === "done") {
      setStreamedWords(words.length);
      return;
    }
    if (phase !== "streaming") {
      setStreamedWords(0);
      return;
    }
    let idx = 0;
    const id = window.setInterval(() => {
      idx += 1;
      if (idx >= words.length) {
        setStreamedWords(words.length);
        window.clearInterval(id);
      } else {
        setStreamedWords(idx);
      }
    }, 68);
    return () => window.clearInterval(id);
  }, [phase, activeScript.streamText]);

  // Live video frame ticker
  useEffect(() => {
    if (activeModality !== "video" || (phase !== "streaming" && phase !== "done")) return;
    const id = window.setInterval(() => {
      setVideoFrame((f) => (f >= 121 ? 1 : f + 4));
    }, 120);
    return () => window.clearInterval(id);
  }, [activeModality, phase]);

  // Interactive audio waveform playback scrubber
  useEffect(() => {
    if (!audioPlaying) {
      if (audioTimerRef.current) window.clearInterval(audioTimerRef.current);
      return;
    }
    audioTimerRef.current = window.setInterval(() => {
      setAudioProgress((p) => (p >= 100 ? 0 : p + 2.5));
    }, 150);
    return () => {
      if (audioTimerRef.current) window.clearInterval(audioTimerRef.current);
    };
  }, [audioPlaying]);

  const handleToggleAudio = () => {
    const next = !audioPlaying;
    setAudioPlaying(next);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      if (next) {
        const u = new SpeechSynthesisUtterance(
          "Q4 Gyra launch brief: SuperGyra 2.0, Pro Ultra relighting, and 720p Studio are live across 195 countries.",
        );
        u.rate = 1.04;
        u.onend = () => setAudioPlaying(false);
        window.speechSynthesis.speak(u);
      }
    }
  };

  const handleCopy = (txt: string) => {
    navigator.clipboard?.writeText(txt).catch(() => {});
    setCopiedMsg(true);
    window.setTimeout(() => setCopiedMsg(false), 1500);
  };

  const phaseBadge =
    phase === "typing"
      ? "TYPING"
      : phase === "routing"
        ? "ROUTING"
        : phase === "thinking"
          ? `THINKING · ${thinkingSecs}S`
          : phase === "searching"
            ? "GROUNDING"
            : phase === "streaming"
              ? "STREAMING"
              : "DELIVERED";

  // Helper to render each full-height slide inside the locked scrollable box!
  // Active slide strictly obeys sequential phases (never showing final output early!).
  // Adjacent slides stay cleanly pre-rendered so soft scrolling feels rich & seamless!
  const renderSlide = (modalityId: LiveModalityId) => {
    const script = MODALITY_SCRIPTS[modalityId];
    const isCurrent = modalityId === activeModality;
    const slidePhase: ChatFlowPhase = isCurrent ? phase : "done";

    const showUserMessage = slidePhase !== "typing";
    const showThinking =
      slidePhase === "thinking" ||
      slidePhase === "searching" ||
      slidePhase === "streaming" ||
      slidePhase === "done";
    const showSearching =
      slidePhase === "searching" || slidePhase === "streaming" || slidePhase === "done";
    const searchDone = slidePhase === "streaming" || slidePhase === "done";
    const showFinalContent = slidePhase === "streaming" || slidePhase === "done";
    const showArtifactCard = slidePhase === "done";

    const displayPrompt = isCurrent ? userPrompt : script.prompt;
    const allWords = script.streamText.split(" ");
    const visibleWords = isCurrent ? allWords.slice(0, streamedWords) : allWords;

    return (
      <div
        key={modalityId}
        data-slide={modalityId}
        className="flex h-full w-full shrink-0 snap-start flex-col justify-start overflow-y-auto px-3.5 py-3.5 sm:px-6 sm:py-4"
      >
        <div className="mx-auto flex w-full max-w-[740px] flex-1 flex-col">
          {!showUserMessage ? (
            /* Authentic Dashboard Standby View while 3D GYRA Keyboard types into bottom display bar */
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-[#5B9EC2]/75">
                <Zap className="h-5 w-5" />
              </div>
              <p className="text-[13.5px] font-medium text-zinc-200">
                Gyra is Here to Help, Ask Anything.
              </p>
              <p className="mt-1 font-mono-tech text-[9.5px] tracking-[0.12em] text-[#5B9EC2] uppercase">
                GYRA 3D Keyboard typing · Scroll smoothly to browse modalities
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* REAL DASHBOARD USER MESSAGE BUBBLE (Soft lazy rise!) */}
              <div className={`flex justify-end ${isCurrent ? "gyra-lazy-in" : ""}`}>
                <div className="max-w-[88%] rounded-3xl bg-[#2f2f2f] px-4 py-2 text-[13px] leading-relaxed text-white sm:max-w-[82%] sm:px-4.5 sm:text-[13.5px]">
                  {displayPrompt}
                </div>
              </div>

              {/* REAL DASHBOARD ASSISTANT RESPONSE BLOCK */}
              <div className="flex w-full flex-col items-start">
                {/* A. LIVE THINKING / SEARCHING / AGENT TIMELINE */}
                {showThinking && (
                  <div className={`mb-2.5 flex w-full flex-col gap-1.5 border-l-2 border-zinc-800 py-0.5 pl-3 sm:pl-3.5 ${isCurrent ? "gyra-lazy-in" : ""}`}>
                    <details
                      open={slidePhase === "thinking" || slidePhase === "searching"}
                      className="group"
                    >
                      <summary className="flex w-fit cursor-pointer select-none items-center gap-2 text-[12px] text-zinc-400">
                        <span className="relative flex h-3.5 w-3.5 items-center justify-center overflow-hidden rounded-full border border-blue-400/50 bg-blue-500/20">
                          <span
                            className={`h-1.5 w-1.5 rounded-full bg-blue-300 ${
                              slidePhase === "thinking" ? "animate-ping" : ""
                            }`}
                          />
                        </span>
                        <span>
                          {slidePhase === "thinking"
                            ? `Thinking for ${thinkingSecs}s...`
                            : `Thought for 2s`}
                        </span>
                        <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="mt-1 space-y-0.5 pl-5 font-mono-tech text-[10.5px] leading-relaxed text-zinc-500">
                        <p className={isCurrent ? "gyra-lazy-in" : ""}>{script.reasoningSteps[0]}</p>
                        {(slidePhase !== "thinking" || thinkingSecs >= 2) && (
                          <p className={isCurrent ? "gyra-lazy-in" : ""}>{script.reasoningSteps[1]}</p>
                        )}
                      </div>
                    </details>

                    {showSearching && !searchDone && (
                      <div className={`flex items-center gap-2 text-[11.5px] text-zinc-400 ${isCurrent ? "gyra-lazy-in" : ""}`}>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
                        <span>{script.searchLabel}</span>
                      </div>
                    )}

                    {searchDone && (
                      <div className={`flex flex-wrap items-center gap-2 ${isCurrent ? "gyra-lazy-in" : ""}`}>
                        <div className="flex w-fit items-center gap-1.5 rounded-xl border border-zinc-800 bg-[#1c1c1c] px-2 py-0.5">
                          <div className="flex -space-x-1">
                            {script.sources.slice(0, 3).map((src, i) => (
                              <span
                                key={i}
                                className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#1c1c1c] bg-zinc-800 text-[8px] font-bold text-white uppercase"
                              >
                                {src.domain}
                              </span>
                            ))}
                          </div>
                          <span className="text-[10.5px] font-medium text-zinc-300">
                            {script.sources.length} sources
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              slidePhase === "done" ? "bg-[#34D399]" : "bg-[#5B9EC2] animate-pulse"
                            }`}
                          />
                          <strong className="font-semibold text-white">{script.agentName}</strong>
                        </span>
                      </div>
                    )}

                    {slidePhase === "searching" && (
                      <div className={`flex items-center gap-2 text-[11.5px] text-zinc-400 ${isCurrent ? "gyra-lazy-in" : ""}`}>
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                        <span className="font-semibold text-white">{script.agentName}</span>
                        <span className="font-mono-tech text-[10.5px]">{script.agentStatus}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* B. LAZY WORD-BY-WORD STREAMING ASSISTANT PROSE (Each word glides in softly!) */}
                {showFinalContent && (
                  <p className="text-[12.5px] leading-[1.6] text-zinc-200 sm:text-[13.5px]">
                    {visibleWords.map((w, wi) => (
                      <span
                        key={`${modalityId}-w-${wi}`}
                        className={isCurrent && slidePhase === "streaming" ? "inline-block gyra-lazy-in mr-1" : "mr-1"}
                      >
                        {w}
                      </span>
                    ))}
                    {slidePhase === "streaming" && (
                      <span className="inline-block h-3 w-1.5 animate-pulse rounded-[1px] bg-[#5B9EC2] align-middle" />
                    )}
                  </p>
                )}

                {/* C. MODALITY INTERACTIVE ARTIFACT CARD (Soft lazy rise after streaming completes!) */}
                {showArtifactCard && modalityId === "chat" && (
                  <div className={`mt-2.5 w-full space-y-2 rounded-2xl border border-zinc-800 bg-[#070B10]/95 p-2.5 sm:p-3 ${isCurrent ? "gyra-lazy-in" : ""}`}>
                    <div className="flex items-center justify-between font-mono-tech text-[9px] uppercase">
                      <span className="inline-flex items-center gap-1 text-[#9CC4DC]">
                        <Sparkles className="h-3 w-3 text-[#5B9EC2]" />
                        <span>Gyra Gen UI</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#6EE7B7]">
                        <Sun className="h-3 w-3" /> Golden Hour Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCity("lisbon");
                          setPlanLocked(false);
                        }}
                        className={`rounded-xl border p-2 text-left transition-colors cursor-pointer ${
                          selectedCity === "lisbon"
                            ? "border-[#5B9EC2] bg-[#081A27]"
                            : "border-zinc-800 bg-black/70 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-display text-[14px] font-bold text-white uppercase sm:text-[15px]">
                            Lisbon, PT
                          </span>
                          <span className="rounded bg-[#1F5B7C] px-1 py-0.5 font-mono-tech text-[7.5px] text-white uppercase">
                            Best
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between font-mono-tech text-[9.5px]">
                          <span className="text-zinc-400">22°C · 18:42</span>
                          <span className="text-[#34D399]">$2,680</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCity("tokyo");
                          setPlanLocked(false);
                        }}
                        className={`rounded-xl border p-2 text-left transition-colors cursor-pointer ${
                          selectedCity === "tokyo"
                            ? "border-[#5B9EC2] bg-[#081A27]"
                            : "border-zinc-800 bg-black/70 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-display text-[14px] font-bold text-white uppercase sm:text-[15px]">
                            Tokyo, JP
                          </span>
                          <span className="rounded border border-zinc-700 px-1 py-0.5 font-mono-tech text-[7.5px] text-zinc-300 uppercase">
                            Neon
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between font-mono-tech text-[9.5px]">
                          <span className="text-zinc-400">19°C · 17:28</span>
                          <span className="text-white">$3,420</span>
                        </div>
                      </button>
                    </div>

                    <div className="rounded-xl border border-zinc-800/80 bg-black/70 px-2.5 py-2 font-mono-tech text-[9.5px]">
                      <div className="space-y-1">
                        {(selectedCity === "lisbon"
                          ? [
                              { l: "Flights", v: "$940", w: "55%" },
                              { l: "Loft & Crew", v: "$1,740", w: "66%" },
                            ]
                          : [
                              { l: "Flights", v: "$1,480", w: "86%" },
                              { l: "Loft & Crew", v: "$1,940", w: "78%" },
                            ]
                        ).map((r) => (
                          <div key={r.l} className="grid grid-cols-[74px_1fr_42px] items-center gap-2">
                            <span className="text-zinc-400">{r.l}</span>
                            <div className="h-1.5 rounded-full bg-zinc-800">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#1F5B7C] to-[#5B9EC2] transition-all duration-300"
                                style={{ width: r.w }}
                              />
                            </div>
                            <span className="text-right text-white">{r.v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-zinc-800 pt-1.5">
                        <span className="font-sans text-[11px] text-zinc-400">
                          {planLocked
                            ? `✓ ${selectedCity === "lisbon" ? "Lisbon" : "Tokyo"} locked`
                            : selectedCity === "lisbon"
                              ? "Saves $740 vs Tokyo"
                              : "+24% Night Neon Permits"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPlanLocked((v) => !v)}
                          className={`rounded-lg px-2 py-0.5 text-[9px] uppercase transition-colors cursor-pointer ${
                            planLocked
                              ? "border border-[#34D399]/50 bg-[#06241C] text-[#6EE7B7]"
                              : "bg-[#1F5B7C] text-white hover:bg-[#2A7299]"
                          }`}
                        >
                          {planLocked ? "Locked ✓" : `Lock ${selectedCity}`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {showArtifactCard && modalityId === "image" && (
                  <div className={`mt-2.5 w-full max-w-[470px] overflow-hidden rounded-2xl border border-zinc-800 bg-[#0d0d0d] ${isCurrent ? "gyra-lazy-in" : ""}`}>
                    <div className="flex items-center justify-between border-b border-zinc-800 bg-[#141414] px-3 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-zinc-300" />
                        <span className="text-[11.5px] font-medium text-white">Imagine · Pro Ultra I2I</span>
                      </div>
                      <span className="font-mono-tech text-[9px] text-[#34D399]">SSIM 0.994</span>
                    </div>
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
                      <picture className="block h-full w-full">
                        <source srcSet="/showcase/edit-after.webp" type="image/webp" />
                        <img src="/showcase/edit-after.jpg" alt="2700K dusk relight" className="h-full w-full object-cover" />
                      </picture>
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
                      >
                        <picture className="block h-full w-full">
                          <source srcSet="/showcase/edit-before.webp" type="image/webp" />
                          <img src="/showcase/edit-before.jpg" alt="Original daylight" className="h-full w-full object-cover" />
                        </picture>
                      </div>
                      <div className="pointer-events-none absolute inset-y-0 w-[2px] bg-[#5B9EC2]" style={{ left: `${splitPct}%` }} />
                      <span className="font-mono-tech absolute bottom-1.5 left-1.5 rounded bg-black/85 px-1.5 py-0.5 text-[8.5px] text-zinc-200 uppercase">
                        Daylight
                      </span>
                      <span className="font-mono-tech absolute bottom-1.5 right-1.5 rounded bg-[#1F5B7C] px-1.5 py-0.5 text-[8.5px] text-white uppercase">
                        2700K Dusk
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-zinc-800 bg-[#141414] px-3 py-1.5">
                      <input
                        type="range"
                        min={10}
                        max={90}
                        value={splitPct}
                        onChange={(e) => setSplitPct(Number(e.target.value))}
                        aria-label="Compare daylight and 2700K relight"
                        className="gyra-slider w-32 sm:w-40"
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-200">
                          <Download className="h-2.5 w-2.5" /> Save
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-200">
                          <Share2 className="h-2.5 w-2.5" /> Share
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {showArtifactCard && modalityId === "video" && (
                  <div className={`mt-2.5 w-full max-w-[470px] overflow-hidden rounded-2xl border border-zinc-800 bg-[#0d0d0d] ${isCurrent ? "gyra-lazy-in" : ""}`}>
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
                      <video
                        src="/products-hero-bg.mp4"
                        poster="/video-samples/headset-f001.webp"
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="h-full w-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                      <div className="font-mono-tech absolute left-2.5 right-2.5 top-2 flex items-center justify-between text-[9px] text-[#C5DFEE]">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                          <span>LTX-VIDEO 13B</span>
                        </span>
                        <span>720P · 24 FPS</span>
                      </div>
                      <div className="font-mono-tech absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[9px] text-white">
                        <span>FRAME {String(videoFrame).padStart(3, "0")} / 121</span>
                        <span className="text-[#34D399]">ANCHOR LOCKED</span>
                      </div>
                    </div>
                  </div>
                )}

                {showArtifactCard && modalityId === "audio" && (
                  <div className={`mt-2.5 w-full max-w-[490px] rounded-2xl border border-zinc-800 bg-[#080C12] p-3 ${isCurrent ? "gyra-lazy-in" : ""}`}>
                    <div className="flex items-center justify-between font-mono-tech text-[9px] uppercase">
                      <span className="inline-flex items-center gap-1 text-[#9CC4DC]">
                        <Volume2 className="h-3.5 w-3.5 text-[#5B9EC2]" />
                        <span>Gyra Nova · 48kHz Voice</span>
                      </span>
                      <span className="text-[#34D399]">WHISPER V3</span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleToggleAudio}
                        aria-label={audioPlaying ? "Pause audio brief" : "Play audio brief"}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1F5B7C] text-white transition-colors hover:bg-[#2A7299] cursor-pointer"
                      >
                        {audioPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                      </button>
                      <div className="flex h-9 flex-1 items-center gap-[2.5px]">
                        {WAVEFORM_BARS.map((h, i) => {
                          const pct = (i / WAVEFORM_BARS.length) * 100;
                          const played = pct <= audioProgress;
                          return (
                            <span
                              key={i}
                              className={`flex-1 rounded-full transition-all duration-150 ${
                                played ? "bg-[#5B9EC2]" : "bg-zinc-700"
                              }`}
                              style={{
                                height: `${audioPlaying ? Math.max(20, (h + i * 11) % 95) : h}%`,
                              }}
                            />
                          );
                        })}
                      </div>
                      <span className="font-mono-tech shrink-0 text-[9.5px] text-zinc-400">
                        0:{String(Math.round((audioProgress / 100) * 12)).padStart(2, "0")} / 0:12
                      </span>
                    </div>
                    <p className="mt-2.5 rounded-xl border border-zinc-800/80 bg-black/70 px-2.5 py-1.5 text-[11.5px] leading-relaxed text-zinc-300">
                      “Q4 Gyra launch brief: SuperGyra 2.0, Pro Ultra relighting, and 720p Studio
                      are live across 195 countries at edge latency.”
                    </p>
                  </div>
                )}

                {/* REAL DASHBOARD ACTION BAR */}
                {showArtifactCard && (
                  <div className="mt-2 flex items-center gap-1 text-zinc-400">
                    <button
                      type="button"
                      onClick={() => handleCopy(script.streamText)}
                      title="Copy"
                      className="rounded-lg p-1.5 transition-colors hover:bg-zinc-800 hover:text-white cursor-pointer"
                    >
                      {copiedMsg ? <Check className="h-3.5 w-3.5 text-[#34D399]" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLiked(liked === "up" ? null : "up")}
                      title="Good response"
                      className={`rounded-lg p-1.5 transition-colors hover:bg-zinc-800 cursor-pointer ${
                        liked === "up" ? "text-[#34D399]" : "hover:text-white"
                      }`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLiked(liked === "down" ? null : "down")}
                      title="Bad response"
                      className={`rounded-lg p-1.5 transition-colors hover:bg-zinc-800 cursor-pointer ${
                        liked === "down" ? "text-red-400" : "hover:text-white"
                      }`}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleAudio}
                      title="Read aloud"
                      className="rounded-lg p-1.5 transition-colors hover:bg-zinc-800 hover:text-white cursor-pointer"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={onReplay}
                      title="Regenerate"
                      className="ml-auto rounded-lg p-1.5 transition-colors hover:bg-zinc-800 hover:text-white cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    /* ROCK-SOLID FIXED-HEIGHT HARDWARE BOX (ZERO outer reshaping/jumping — just like E2B!) */
    <div
      data-testid="dashboard-live-chat-studio"
      data-phase={phase}
      className="mx-auto flex h-[564px] w-full max-w-[1000px] flex-col overflow-hidden rounded-[8px] border border-white/15 bg-black text-white shadow-[0_24px_80px_rgba(0,0,0,0.85)] sm:h-[584px]"
    >
      {/* 1. UNIFIED ONE-TABLE MODALITY HEADER (Chat | Image | Video | Audio) */}
      <div
        role="tablist"
        aria-label="Live Flow Modalities"
        className="grid shrink-0 grid-cols-4 divide-x divide-white/10 border-b border-white/10 bg-[#05080E]"
      >
        {MODALITY_ORDER.map((id) => {
          const item = MODALITY_SCRIPTS[id];
          const active = id === activeModality;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectModality(id, false)}
              className={`relative flex min-h-[42px] items-center justify-center gap-1.5 overflow-hidden px-2 font-mono-tech text-[10px] tracking-[0.11em] uppercase transition-colors cursor-pointer sm:text-[11px] ${
                active ? "bg-[#091824] text-white" : "text-[#7B92A6] hover:bg-white/[0.03] hover:text-white"
              }`}
            >
              {active && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-[#5B9EC2]" />}
              {active && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-35"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(156, 196, 220, 0.7) 1px, transparent 1px), radial-gradient(rgba(31, 91, 124, 0.85) 1px, transparent 1px)",
                    backgroundSize: "6px 6px, 6px 6px",
                    backgroundPosition: "0 0, 3px 3px",
                    maskImage: "linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.16) 50%, rgba(0,0,0,0.85))",
                    WebkitMaskImage:
                      "linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.16) 50%, rgba(0,0,0,0.85))",
                  }}
                />
              )}
              <span className="relative z-10 text-[#5B9EC2]">{item.code}</span>
              <span className="relative z-10 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. AUTHENTIC GYRA DASHBOARD TOP BAR (Fixed height) */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800/70 bg-[#050608] px-3.5 py-2 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2 py-1">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as "gyra-super2.0" | "gyra-1.0")}
              aria-label="Select Gyra model"
              className="bg-transparent text-[11.5px] font-semibold text-white outline-none cursor-pointer"
            >
              <option value="gyra-super2.0" className="bg-black text-blue-400">
                ⚡ SuperGyra 2.0
              </option>
              <option value="gyra-1.0" className="bg-black text-white">
                Gyra 1.0
              </option>
            </select>
          </div>
          <div className="hidden h-4 w-px bg-zinc-800 sm:block" />
          <span className="hidden truncate text-[12px] font-medium text-zinc-400 sm:inline">
            {activeScript.threadTitle}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`font-mono-tech inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[9px] tracking-[0.1em] uppercase ${
              phase === "done"
                ? "border-[#34D399]/40 bg-[#051B16] text-[#6EE7B7]"
                : "border-[#5B9EC2]/40 bg-[#081A27] text-[#9CC4DC]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                phase === "done" ? "bg-[#34D399]" : "bg-[#5B9EC2] animate-pulse"
              }`}
            />
            <span>{phaseBadge}</span>
          </span>

          <button
            type="button"
            onClick={onToggleAutoFlow}
            aria-label={autoFlow ? "Pause Auto-Flow" : "Resume Auto-Flow"}
            className={`font-mono-tech inline-flex h-[26px] items-center gap-1 rounded-md border px-2 text-[9px] tracking-[0.08em] uppercase transition-colors cursor-pointer ${
              autoFlow
                ? "border-[#5B9EC2] bg-[#1F5B7C] text-white"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            {autoFlow ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span className="hidden sm:inline">{autoFlow ? "Auto" : "Paused"}</span>
          </button>

          <button
            type="button"
            onClick={onReplay}
            aria-label="Replay current chat flow"
            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 3. FIXED-HEIGHT SOFT-SCROLLABLE 4-SCENE SHOWCASE VIEWPORT (Atmospheric dark-glass studio backdrop!) */}
      <div className="relative min-h-0 flex-1 bg-gradient-to-b from-[#060B12] via-[#03060A] to-[#020407]">
        {/* Ambient steel-blue top-edge spotlight tracking the active modality column */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-32 transition-all duration-500"
          style={{
            background: `radial-gradient(ellipse 46% 90% at ${(MODALITY_ORDER.indexOf(activeModality) * 25 + 12.5).toFixed(1)}% 0%, rgba(42, 114, 153, 0.16), transparent 75%)`,
          }}
        />
        <div
          ref={scrollerRef}
          onScroll={handleInternalScroll}
          data-testid="dashboard-chat-scroller"
          className="relative z-10 h-full w-full overflow-y-auto scroll-smooth snap-y snap-mandatory overscroll-contain"
        >
          {MODALITY_ORDER.map((id) => renderSlide(id))}
        </div>

        {/* Quiet Right-Edge Vertical 4-Modality Scroll Rail */}
        <div
          aria-label="Scroll position across Chat, Image, Video, Audio"
          className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-2 sm:flex"
        >
          {MODALITY_ORDER.map((id) => {
            const active = id === activeModality;
            return (
              <button
                key={id}
                type="button"
                title={`Scroll to ${MODALITY_SCRIPTS[id].label}`}
                aria-label={`Scroll to ${MODALITY_SCRIPTS[id].label}`}
                onClick={() => onSelectModality(id, false)}
                className={`w-1.5 rounded-full transition-all cursor-pointer ${
                  active ? "h-5 bg-[#5B9EC2]" : "h-1.5 bg-zinc-700 hover:bg-zinc-500"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* 4. READ-ONLY DISPLAY-ONLY DASHBOARD COMPOSER MIRROR (Non-editable — reflects 3D Keyboard typing live!) */}
      <div className="shrink-0 border-t border-zinc-900 bg-[#030508] px-3.5 py-2.5 sm:px-6 sm:py-3">
        <div
          aria-live="off"
          className="mx-auto flex w-full max-w-[740px] select-none flex-col gap-1.5 rounded-[24px] border border-zinc-800/80 bg-[#1B1C20] px-3.5 py-2 pointer-events-none"
        >
          <div className="flex min-h-[22px] items-center gap-1.5 overflow-hidden text-[12.5px] sm:text-[13.5px]">
            {phase === "typing" && typedComposerText ? (
              <span className="truncate text-white">
                {typedComposerText}
                <span className="gyra-cursor ml-1 inline-block align-middle" />
              </span>
            ) : (
              <span className="truncate text-zinc-500">
                Scroll Chat → Image → Video → Audio · Ask via top prompt bar
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-400">
                <Sparkles className="h-3 w-3" />
                <span>Think</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-400">
                <Search className="h-3 w-3" />
                <span>Search</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                <Plus className="h-3.5 w-3.5" />
              </span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  phase === "typing" || phase === "routing"
                    ? "bg-[#1F5B7C] text-white"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
