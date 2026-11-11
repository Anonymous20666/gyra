"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GyraMark from "../components/GyraMark";
import { validatePromptInput } from "./fieldMath";
import HeroVideoShowcase from "./HeroVideoShowcase";

export type OmniMode =
  | "Chat"
  | "Image Gen"
  | "Video Studio"
  | "Code Agent"
  | "Deep Research";

export const OMNI_MODES: OmniMode[] = [
  "Chat",
  "Image Gen",
  "Video Studio",
  "Code Agent",
  "Deep Research",
];

const MODEL_BADGE = "Gyra Omni 4.0";

export interface DemoSuggestionChip {
  id: string;
  label: string;
  mode: OmniMode;
  prompt: string;
  previewTitle: string;
  previewSummary: string;
  previewMedia?: string;
  previewBadge: string;
  previewCtaHref: string;
  previewCtaLabel: string;
}

const DEMO_CHIPS: DemoSuggestionChip[] = [
  {
    id: "chip-car-video",
    label: "85mm Tokyo Hypercar Drift (60fps)",
    mode: "Video Studio",
    prompt:
      "Track-level 85mm tracking shot of a matte-black hypercar drifting through wet Tokyo neon streets at dusk, 60fps.",
    previewTitle: "Video Studio · brief loaded",
    previewSummary:
      "Camera-rig brief loaded from the plate below. Runs as a real render job in the full workspace.",
    previewMedia: "/media/showcase/hypercar-tokyo-photoreal.jpg",
    previewBadge: "Video Studio · reference plate",
    previewCtaHref: "#video-studio",
    previewCtaLabel: "See camera-rig preview ↓",
  },
  {
    id: "chip-photo-restyle",
    label: "Restyle Studio Ramen Lighting",
    mode: "Image Gen",
    prompt:
      "Change the background of this rustic wooden-table ramen bowl to a clean studio neutral blue and enhance volumetric steam lighting.",
    previewTitle: "Image Gen · brief loaded",
    previewSummary:
      "Restyle brief loaded for the subject-locked edit. The plate below is the reference target — the live compare sits in the cards section.",
    previewMedia: "/media/showcase/ramen-after-studio.jpg",
    previewBadge: "Image Gen · reference plate",
    previewCtaHref: "#showcase-cards",
    previewCtaLabel: "Compare the plates ↓",
  },
  {
    id: "chip-code-slider",
    label: "Build React SaaS Revenue Slider",
    mode: "Code Agent",
    prompt:
      "Build an interactive SaaS revenue forecast slider with dark glassmorphism, compound ARR math, and 12-month telemetry in React.",
    previewTitle: "Code Agent · brief loaded",
    previewSummary:
      "React + TypeScript brief loaded. The live component in the cards section is the real generated artifact — drag its sliders.",
    previewBadge: "Code Agent · live artifact below",
    previewCtaHref: "#card-code-artifact",
    previewCtaLabel: "Try the live component ↓",
  },
  {
    id: "chip-competitor-deck",
    label: "Competitor Pricing Matrix & Deck",
    mode: "Deep Research",
    prompt:
      "Research our top 3 competitors' pricing, build a margin comparison matrix, and export an 8-slide executive pitch deck.",
    previewTitle: "Deep Research · brief loaded",
    previewSummary:
      "Research brief loaded. The card below shows a sample run of the full workflow, clearly labelled, with an exportable deck.",
    previewBadge: "Deep Research · sample run below",
    previewCtaHref: "#card-workflow-agent",
    previewCtaLabel: "View sample run ↓",
  },
];

export default function Hero() {
  const [value, setValue] = useState("");
  const [activeMode, setActiveMode] = useState<OmniMode>("Chat");
  const [focused, setFocused] = useState(false);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [hintError, setHintError] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<DemoSuggestionChip | null>(null);
  const [isTypingDemo, setIsTypingDemo] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<number | null>(null);

  const hasText = value.trim().length > 0;

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 148)}px`;
  }, [value]);

  const triggerAutoType = useCallback((chip: DemoSuggestionChip) => {
    if (typingTimerRef.current) {
      window.clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    setActiveMode(chip.mode);
    setHintError(null);
    setActivePreview(chip);
    setIsTypingDemo(true);

    // Immediately set an initial prefix and rapidly stream the rest so both human eyes and automated snapshots see instant response
    const target = chip.prompt;
    let charIndex = Math.min(target.length, 24);
    setValue(target.slice(0, charIndex));

    typingTimerRef.current = window.setInterval(() => {
      charIndex += 14;
      if (charIndex >= target.length) {
        setValue(target);
        setIsTypingDemo(false);
        if (typingTimerRef.current) {
          window.clearInterval(typingTimerRef.current);
          typingTimerRef.current = null;
        }
      } else {
        setValue(target.slice(0, charIndex));
      }
    }, 18);
  }, []);

  useEffect(() => {
    const onCustomRemix = (e: Event) => {
      const detail = (e as CustomEvent<{ prompt: string; mode: OmniMode }>).detail;
      if (!detail) return;
      const matchingChip =
        DEMO_CHIPS.find((c) => c.prompt === detail.prompt) || {
          id: "custom-remix",
          label: "Remixed Prompt",
          mode: detail.mode,
          prompt: detail.prompt,
          previewTitle: `${detail.mode} · brief loaded`,
          previewSummary: `Loaded "${detail.prompt}" into the ${detail.mode} workspace flow. Send it below or refine the parameters first.`,
          previewBadge: `${detail.mode} · ${MODEL_BADGE}`,
          previewCtaHref: "#showcase-cards",
          previewCtaLabel: "Explore the live artifacts ↓",
        };
      triggerAutoType(matchingChip);
      document.getElementById("omni-composer")?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    window.addEventListener("gyra:remix-prompt", onCustomRemix);
    return () => {
      window.removeEventListener("gyra:remix-prompt", onCustomRemix);
      if (typingTimerRef.current) window.clearInterval(typingTimerRef.current);
    };
  }, [triggerAutoType]);

  const handleSubmit = (rawOverride?: string) => {
    const candidate = rawOverride !== undefined ? rawOverride : value;
    const check = validatePromptInput(candidate, 1000);
    if (!check.valid) {
      setHintError(check.error || "Enter a prompt or select a suggestion chip below.");
      inputRef.current?.focus();
      return;
    }
    setHintError(null);

    try {
      window.sessionStorage.setItem(
        "gyra_entry_prompt",
        JSON.stringify({
          text: check.cleaned,
          mode: activeMode,
          model: "omni-4",
          ts: Date.now(),
        })
      );
    } catch {}

    const matchedChip =
      DEMO_CHIPS.find(
        (c) => c.prompt.toLowerCase() === check.cleaned.toLowerCase()
      ) || {
        id: "live-run",
        label: activeMode,
        mode: activeMode,
        prompt: check.cleaned,
        previewTitle: `${activeMode} · brief sent to workspace`,
        previewSummary: `Stored "${check.cleaned}" for the ${activeMode} workspace. Continue in the full app and it will be waiting for you.`,
        previewMedia:
          activeMode === "Video Studio"
            ? "/media/showcase/hypercar-tokyo-photoreal.jpg"
            : activeMode === "Image Gen"
            ? "/media/showcase/ramen-after-studio.jpg"
            : undefined,
        previewBadge: `${activeMode} · reference plate`,
        previewCtaHref: "https://gyra-tester.duckdns.org/dashboard",
        previewCtaLabel: "Continue in Full Workspace →",
      };

    setActivePreview(matchedChip);
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeMb = file.size / 1048576;
    const sizeLabel =
      sizeMb >= 1 ? `${sizeMb.toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    setAttachedFile(`${file.name} (${sizeLabel})`);
  };

  return (
    <header className="gy-hero" id="top">
      <div className="gy-hero-inner">
        <div className="gy-hero-identity">
          <span className="gy-mark-hero" aria-hidden="true">
            <GyraMark size={48} glow={false} animated={false} />
          </span>
          <p className="gy-eyebrow">
            <span>GYRA OMNI 4.0 · MULTIMODAL CHAT &amp; AUTONOMOUS AGENT PLATFORM</span>
          </p>
        </div>

        <h1 className="gy-h1">
          Intelligence, <span className="gy-h1-accent">engineered to ship.</span>
        </h1>

        <p className="gy-hero-sub">
          Photorealistic studio imagery, camera-controlled video, production
          TypeScript, and autonomous multi-step workflows — one tactile command
          center.
        </p>

        {/* PART 3: REALISTIC MULTIMODAL OMNI-PROMPT BOX (HERO CENTERPIECE) */}
        <div
          id="omni-composer"
          data-testid="omni-prompt-box"
          className={`gy-omni-box ${focused ? "gy-omni-box-focused" : ""}`}
          role="search"
          aria-label="Gyra Multimodal Command Center"
        >
          {/* Interactive Mode Switcher Top Bar */}
          <div className="gy-omni-topbar">
            <div
              className="gy-omni-modes"
              role="tablist"
              aria-label="Multimodal prompt mode switcher"
            >
              {OMNI_MODES.map((mode) => {
                const isSelected = activeMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    className={`gy-omni-mode-pill ${isSelected ? "on" : ""}`}
                    onClick={() => setActiveMode(mode)}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>

            <span className="gy-omni-status-tag">
              {isTypingDemo
                ? "Auto-typing demo…"
                : hasText
                ? `${activeMode} · ready to run`
                : `${activeMode} · ready`}
            </span>
          </div>

          {/* Attached File Chip (real file pick) */}
          {attachedFile && (
            <div className="gy-omni-attachment-row">
              <div className="gy-omni-attachment-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <span>{attachedFile}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  aria-label="Remove attached file"
                  className="gy-omni-attachment-remove"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Main Prompt Textarea */}
          <div className="gy-omni-input-wrap">
            <textarea
              ref={inputRef}
              className="gy-omni-textarea"
              rows={2}
              placeholder={
                activeMode === "Chat"
                  ? "Ask Gyra anything, or describe a workflow to execute…"
                  : activeMode === "Image Gen"
                  ? "Describe camera lens, studio lighting, subject, and surface textures…"
                  : activeMode === "Video Studio"
                  ? "Describe a camera move, physical environment, and subject motion…"
                  : activeMode === "Code Agent"
                  ? "Specify the full-stack React/TypeScript feature or shader to build…"
                  : "Enter a market, technical topic, or competitor set to investigate…"
              }
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (hintError) setHintError(null);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              aria-label="Multimodal prompt input"
            />
          </div>

          {/* Bottom Controls Bar: Paperclip (real file pick), Model Badge, Send Button */}
          <div className="gy-omni-bottombar">
            <div className="gy-omni-tools-left">
              {/* Paperclip Attachment Button — real file input */}
              <div className="gy-tooltip-wrap">
                <button
                  type="button"
                  className={`gy-omni-icon-btn ${attachedFile ? "is-active" : ""}`}
                  aria-label="Attach an image, PDF, or code file"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.zip,.txt,.md,.ts,.tsx,.js,.jsx"
                  style={{ display: "none" }}
                  onChange={handleFilePick}
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <span className="gy-tooltip-bubble" role="tooltip">
                  Attach an image, PDF, or code file
                </span>
              </div>

              {/* Static Model Badge (single platform model — no fictional alternates) */}
              <span
                className="gy-model-select-btn gy-model-badge-static"
                data-testid="model-badge"
                aria-label={`Platform model: ${MODEL_BADGE}`}
              >
                <span className="gy-model-dot" aria-hidden="true" />
                <span>{MODEL_BADGE}</span>
              </span>
            </div>

            <div className="gy-omni-tools-right">
              <button
                type="button"
                data-testid="omni-send-btn"
                className={`gy-omni-send-btn ${hasText ? "is-illuminated" : ""}`}
                onClick={() => handleSubmit()}
                aria-label="Send prompt to the Gyra workspace"
              >
                <span>Send to Workspace</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 12h14M13 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {hintError && (
            <p className="gy-composer-error" role="alert">
              {hintError}
            </p>
          )}

          {/* Loaded-brief Preview Drawer inside Composer when a Demo Chip or Prompt is sent */}
          {activePreview && (
            <div
              className="gy-omni-live-preview"
              data-testid="omni-live-preview"
              role="region"
              aria-label="Loaded prompt preview"
            >
              {activePreview.previewMedia && (
                <img
                  src={activePreview.previewMedia}
                  alt={activePreview.previewTitle}
                  referrerPolicy="no-referrer"
                  className="gy-omni-preview-thumb"
                />
              )}
              <div className="gy-omni-preview-body">
                <div className="gy-omni-preview-meta">
                  <span>{activePreview.previewBadge}</span>
                  <span aria-hidden="true">·</span>
                  <span>Prompt loaded</span>
                </div>
                <h3 className="gy-omni-preview-title">{activePreview.previewTitle}</h3>
                <p className="gy-omni-preview-desc">{activePreview.previewSummary}</p>
              </div>
              <div className="gy-omni-preview-actions">
                <a href={activePreview.previewCtaHref} className="gy-omni-preview-cta">
                  {activePreview.previewCtaLabel}
                </a>
                <button
                  type="button"
                  className="gy-omni-preview-close"
                  onClick={() => setActivePreview(null)}
                  aria-label="Dismiss preview"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4 Clickable Suggestion Pills that load a realistic brief into the composer */}
        <div
          className="gy-demo-chips"
          role="list"
          aria-label="Interactive prompt suggestions"
        >
          {DEMO_CHIPS.map((chip) => {
            const isSelected = activePreview?.id === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                role="listitem"
                data-testid={`demo-chip-${chip.id}`}
                className={`gy-demo-chip ${isSelected ? "on" : ""}`}
                onClick={() => triggerAutoType(chip)}
              >
                <span className="gy-demo-chip-mode">{chip.mode}</span>
                <span className="gy-demo-chip-text">{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* PART 4: INTERACTIVE HERO VIDEO SHOWCASE (CAR, VR HEADSET & MULTIMODAL SWITCHER) */}
        <HeroVideoShowcase
          onRemixPrompt={(prompt, mode) => {
            const matched =
              DEMO_CHIPS.find((c) => c.prompt === prompt) || {
                id: "video-remix",
                label: mode,
                mode,
                prompt,
                previewTitle: `${mode} · brief loaded`,
                previewSummary: `Loaded "${prompt}" into the ${mode} workspace flow. Adjust the parameters above and send it when ready.`,
                previewMedia:
                  mode === "Video Studio"
                    ? "/media/showcase/hypercar-tokyo-photoreal.jpg"
                    : undefined,
                previewBadge: `${mode} · ${MODEL_BADGE}`,
                previewCtaHref: "https://gyra-tester.duckdns.org/studio",
                previewCtaLabel: "Open in Full Studio →",
              };
            triggerAutoType(matched);
            document
              .getElementById("omni-composer")
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        />
      </div>
    </header>
  );
}
