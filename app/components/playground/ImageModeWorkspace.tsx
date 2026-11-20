"use client";

import Link from "next/link";
import { useState } from "react";
import { BookmarkPlus, Download, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import {
  filterSupportedParams,
  validatePromptInput,
  type GyraModelSpec,
} from "../../lib/modelCatalog";
import type { ImageHistoryItem } from "../../lib/playgroundStore";

export interface ImageModeWorkspaceProps {
  model: GyraModelSpec;
  params: Record<string, string | number | boolean>;
  draftPrompt: string;
  onChangeDraftPrompt: (val: string) => void;
  history: ImageHistoryItem[];
  onChangeHistory: (next: ImageHistoryItem[]) => void;
  onSavePrompt: (prompt: string) => void;
  onRunMeta: (meta: { latencyMs: number; ttftMs: number | null; status: string }) => void;
  accessToken: string | null;
}

export function ImageModeWorkspace({
  model,
  params,
  draftPrompt,
  onChangeDraftPrompt,
  history,
  onChangeHistory,
  onSavePrompt,
  onRunMeta,
  accessToken,
}: ImageModeWorkspaceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(history[0]?.id ?? null);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selected = history.find((h) => h.id === selectedId) ?? history[0] ?? null;

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (generating) return;

    const check = validatePromptInput("image", draftPrompt);
    if (!check.ok) {
      setErrorMsg(check.error);
      return;
    }

    if (!accessToken) {
      setErrorMsg("Sign in is required to dispatch authenticated image renders through /api/fal/proxy.");
      return;
    }

    if (!model.proxyTarget) {
      setErrorMsg("Selected model does not declare an active image proxy endpoint.");
      return;
    }

    setErrorMsg(null);
    setGenerating(true);
    const startedAt = performance.now();

    try {
      const supported = filterSupportedParams(model, params);
      const body: Record<string, unknown> = {
        prompt: check.clean,
        num_images: 1,
      };

      if (model.id === "fal-ai/flux/dev") {
        body.image_size = supported.image_size || "square_hd";
        body.num_inference_steps = Number(supported.num_inference_steps || 28);
        body.guidance_scale = Number(supported.guidance_scale || 3.5);
        body.enable_safety_checker = Boolean(supported.enable_safety_checker ?? true);
      } else if (model.id === "fal-ai/flux-pro/v1.1-ultra") {
        body.aspect_ratio = supported.aspect_ratio || "4:3";
        body.raw = Boolean(supported.raw ?? true);
        body.enable_safety_checker = Boolean(supported.enable_safety_checker ?? true);
        if (typeof supported.reference_image === "string" && supported.reference_image.startsWith("data:")) {
          body.image_url = supported.reference_image;
        }
      }

      const res = await fetch("/api/fal/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fal-target-url": `https://fal.run/${model.proxyTarget}`,
          "x-gyra-user-token": accessToken,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      const latencyMs = Math.round(performance.now() - startedAt);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.detail ||
          data?.error?.message ||
          data?.error ||
          `Image proxy returned HTTP ${res.status}.`;
        onRunMeta({ latencyMs, ttftMs: null, status: `HTTP ${res.status}` });
        throw new Error(String(msg));
      }

      const imageUrl = data?.images?.[0]?.url || data?.image?.url || null;
      if (!imageUrl) {
        throw new Error("The image service completed without returning an image URL.");
      }

      const created: ImageHistoryItem = {
        id: `img-${Date.now().toString(36)}`,
        prompt: check.clean,
        modelId: model.id,
        url: imageUrl,
        params: supported,
        latencyMs,
        createdAt: new Date().toISOString(),
      };

      const next = [created, ...history].slice(0, 20);
      onChangeHistory(next);
      setSelectedId(created.id);
      onRunMeta({ latencyMs, ttftMs: null, status: "200 OK" });
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || "Image generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Preview Stage */}
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-[820px] space-y-5">
          {!accessToken && (
            <div className="flex flex-wrap items-center justify-between gap-3 border border-[#CBD7E3] bg-[#F2F6FA] px-4 py-3 text-[13px] text-[#283B4C] dark:border-white/12 dark:bg-[#070D14] dark:text-[#C4D5E2]">
              <span>
                Image generation authenticates through <code className="font-mono-tech text-[12px]">/api/fal/proxy</code>. Sign in to run live renders.
              </span>
              <Link
                href="/login"
                className="border border-[#1B587A] bg-[#1B587A] px-3 py-1 font-mono-tech text-[11px] text-white uppercase"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Main Image Canvas */}
          <div className="border border-[#DCE4EC] bg-white dark:border-white/10 dark:bg-[#04080D]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4ECF3] px-4 py-2.5 dark:border-white/10">
              <div className="font-mono-tech text-[11px] text-[#55697C] dark:text-[#869BAC]">
                {selected ? (
                  <>
                    <span>{selected.modelId}</span>
                    {selected.latencyMs ? (
                      <>
                        <span className="mx-1.5">·</span>
                        <span className="tabular-nums">{(selected.latencyMs / 1000).toFixed(2)}s</span>
                      </>
                    ) : null}
                  </>
                ) : (
                  <span>Output Preview · {model.name}</span>
                )}
              </div>
              {selected && (
                <a
                  href={selected.url}
                  download={`gyra-${selected.id}.png`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 border border-[#D4DFE9] px-2.5 py-1 font-mono-tech text-[11px] text-[#35485A] transition-colors hover:border-[#1B587A] hover:text-[#0B1218] dark:border-white/12 dark:text-[#B9CAD8] dark:hover:border-[#5B9EC2] dark:hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
              )}
            </div>

            <div className="flex min-h-[220px] max-h-[340px] items-center justify-center bg-[#F3F6F9] p-5 dark:bg-[#020508]">
              {generating ? (
                <div className="text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#1B587A] dark:text-[#5B9EC2]" />
                  <p className="mt-3 font-mono-tech text-[12px] text-[#3B5062] dark:text-[#B4C7D6]">
                    Rendering via {model.proxyTarget}...
                  </p>
                </div>
              ) : selected ? (
                <div className="w-full space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected.url}
                    alt={selected.prompt}
                    referrerPolicy="no-referrer"
                    className="mx-auto max-h-[460px] w-auto border border-[#DCE4EC] object-contain dark:border-white/10"
                  />
                  <p className="text-center text-[12.5px] text-[#536678] dark:text-[#8CA0B2]">
                    {selected.prompt}
                  </p>
                </div>
              ) : (
                <div className="max-w-[420px] text-center">
                  <ImageIcon className="mx-auto h-8 w-8 text-[#8BA0B2] dark:text-[#4F6578]" />
                  <p className="mt-3 text-[14px] font-medium text-[#0B1218] dark:text-white">
                    No renders yet in this session
                  </p>
                  <p className="mt-1 text-[13px] text-[#5B7083] dark:text-[#8599AB]">
                    Configure aspect ratio and parameters in the right panel, then enter a visual prompt below.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Generation History */}
          {history.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono-tech text-[10.5px] tracking-[0.1em] text-[#586C7E] uppercase dark:text-[#8499AB]">
                  Session History ({history.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onChangeHistory([]);
                    setSelectedId(null);
                  }}
                  className="inline-flex items-center gap-1 font-mono-tech text-[10.5px] text-[#607486] hover:text-red-600 dark:text-[#8499AB] dark:hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear History</span>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`overflow-hidden border text-left transition-colors ${
                      selected?.id === item.id
                        ? "border-[#1B587A] ring-1 ring-[#1B587A] dark:border-[#5B9EC2] dark:ring-[#5B9EC2]"
                        : "border-[#DCE4EC] dark:border-white/10"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.prompt}
                      referrerPolicy="no-referrer"
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mx-4 mb-2 border border-red-300 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800 sm:mx-6 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-200"
        >
          {errorMsg}
        </div>
      )}

      {/* Prompt Editor */}
      <form
        onSubmit={handleGenerate}
        className="shrink-0 border-t border-[#DCE4EC] bg-white p-3.5 sm:px-6 dark:border-white/10 dark:bg-[#04080D]"
      >
        <div className="mx-auto max-w-[820px]">
          <textarea
            value={draftPrompt}
            onChange={(e) => onChangeDraftPrompt(e.target.value)}
            rows={2}
            aria-label="Image prompt editor"
            placeholder="Describe subject, lighting, camera lens, materials, and framing..."
            className="w-full resize-none border border-[#D4DFE9] bg-[#F8FAFC] px-3.5 py-2.5 text-[14px] text-[#0B1218] placeholder-[#7B8E9F] focus:border-[#1F5B7C] focus:outline-none dark:border-white/12 dark:bg-[#070D14] dark:text-white dark:placeholder-[#5D7182] dark:focus:border-[#5B9EC2]"
          />
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={!draftPrompt.trim()}
              onClick={() => onSavePrompt(draftPrompt)}
              className="inline-flex min-h-[34px] items-center gap-1.5 border border-[#D4DFE9] px-2.5 py-1 font-mono-tech text-[11px] text-[#455A6C] transition-colors hover:border-[#1B587A] hover:text-[#0B1218] disabled:opacity-40 dark:border-white/12 dark:text-[#8FA4B6] dark:hover:border-[#5B9EC2] dark:hover:text-white"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              <span>Save Prompt</span>
            </button>
            <button
              type="submit"
              disabled={generating}
              className="inline-flex min-h-[36px] items-center gap-2 border border-[#1B587A] bg-[#1B587A] px-4 py-1.5 font-mono-tech text-[11.5px] font-medium text-white uppercase transition-colors hover:bg-[#154865] disabled:opacity-50 dark:border-[#5B9EC2] dark:bg-[#1F5B7C] dark:hover:bg-[#286D93]"
            >
              {generating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{generating ? "Generating..." : "Generate Image"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
