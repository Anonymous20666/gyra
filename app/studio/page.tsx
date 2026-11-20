"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "../Logo";
import { supabase } from "../supabase";
import { VIDEO_COST_USD } from "../lib/paymentConfig";
import TemplateModal, { type Template } from "./components/TemplateModal";

type Job = {
  id: string;
  request_id: string;
  prompt: string;
  status: "queued" | "in_progress" | "completed" | "error";
  video_url?: string | null;
  error?: string | null;
  created_at: string;
};

const SUGGESTIONS = [
  "A lion walking through Lagos traffic at sunset",
  "Close-up of jollof rice steaming, cinematic",
  "Woman in colorful ankara dress walking through a market",
  "Drone shot of Victoria Island at night, neon lights",
  "A calabash on water, mystical, gold light",
  "Slow motion of rain hitting a danfo window",
];

export default function StudioPage() {
  const [tab, setTab] = useState<"ask" | "imagine" | "build">("imagine");
  const [prompt, setPrompt] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState<
    "supergyra" | "credits"
  >("supergyra");
  const [credits, setCredits] = useState(0);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [referenceBase64, setReferenceBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ============================================================
  // Load templates + credits + history
  // ============================================================
  useEffect(() => {
    const load = async () => {
      // Templates
      try {
        const tRes = await fetch("/api/v1/video/templates");
        if (tRes.ok) {
          const tData = await tRes.json();
          setTemplates(tData.templates || []);
        }
      } catch (e) {
        console.error("templates fetch error:", e);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setLoading(false);
        return;
      }

      // Credits
      try {
        const subRes = await fetch("/api/v1/subscription/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const subData = await subRes.json();
        if (subRes.ok) {
          setCredits(Number(subData?.creditsUsd || 0));
        } else {
          console.error("subscription/status error:", subData);
        }
      } catch (e) {
        console.error("subscription/status fetch failed:", e);
      }

      // History
      try {
        const res = await fetch("/api/v1/video/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data?.jobs) {
          setJobs(
            data.jobs.map((j: any) => ({
              id: j.id,
              request_id: j.request_id,
              prompt: j.prompt,
              status: j.status,
              video_url: j.video_url,
              error: j.error,
              created_at: j.created_at,
            }))
          );
          const active = data.jobs.find(
            (j: any) => j.status === "queued" || j.status === "in_progress"
          );
          if (active) pollJob(active.request_id);
        }
      } catch (e) {
        console.error("history fetch error:", e);
      }

      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ============================================================
  // Poll for job status
  // ============================================================
  const pollJob = (requestId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/video/status/${requestId}`);
        const data = await res.json();
        if (data?.status === "completed" && data?.videoUrl) {
          setJobs((prev) =>
            prev.map((j) =>
              j.request_id === requestId
                ? { ...j, status: "completed", video_url: data.videoUrl }
                : j
            )
          );
          setGenerating(false);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data?.error) {
          setJobs((prev) =>
            prev.map((j) =>
              j.request_id === requestId
                ? { ...j, status: "error", error: data.error.message }
                : j
            )
          );
          setGenerating(false);
          if (pollRef.current) clearInterval(pollRef.current);
        } else {
          setJobs((prev) =>
            prev.map((j) =>
              j.request_id === requestId ? { ...j, status: "in_progress" } : j
            )
          );
        }
      } catch (e) {
        console.error("poll error", e);
      }
    }, 3000);
  };

  // ============================================================
  // Submit
  // ============================================================
  const submit = async (
    overridePrompt?: string,
    overrideImage?: string | null
  ) => {
    const p = (overridePrompt ?? prompt).trim();
    if (!p || generating) return;
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setError("Please sign in first.");
      return;
    }

    setGenerating(true);
    setPrompt("");

    try {
      const res = await fetch("/api/v1/video/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gyra-user-token": token,
        },
        body: JSON.stringify({
          prompt: p,
          imageBase64: overrideImage ?? referenceBase64 ?? undefined,
        }),
      });
      const data = await res.json();

      if (res.status === 402) {
        setPaywallReason(
          data?.error?.code === "insufficient_credits" ? "credits" : "supergyra"
        );
        setShowPaywall(true);
        setGenerating(false);
        return;
      }

      if (!res.ok || !data?.requestId) {
        setError(data?.error?.message || "Could not queue generation.");
        setGenerating(false);
        return;
      }

      if (typeof data.newBalance === "number") setCredits(data.newBalance);

      setJobs((prev) => [
        {
          id: `pending-${Date.now()}`,
          request_id: data.requestId,
          prompt: p,
          status: "queued",
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      setReferencePreview(null);
      setReferenceBase64(null);
      pollJob(data.requestId);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
      setGenerating(false);
    }
  };

  const handlePhoto = (file: File | null) => {
    if (!file) {
      setReferencePreview(null);
      setReferenceBase64(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setReferencePreview(result);
      setReferenceBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const downloadVideo = async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${name.replace(/[^a-z0-9]/gi, "_").slice(0, 40)}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 shrink-0">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={26} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">STUDIO</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/credits"
            className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-full transition-colors"
          >
            <span className="text-xs">💎</span>
            <span className="text-xs font-medium text-blue-300">
              ${credits.toFixed(2)}
            </span>
            <span className="text-xs text-blue-400">+</span>
          </Link>
          <Link
            href="/playground?mode=video"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Playground
          </Link>
          <Link
            href="/workspace"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Workspace
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-8 pt-5 pb-4 shrink-0">
        {(["ask", "imagine", "build"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm font-medium capitalize transition-colors relative pb-1 ${
              tab === t ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {tab === "imagine" && (
          <div className="max-w-5xl mx-auto px-4 pb-48">
            {/* Animate your photos */}
            <div className="mb-8">
              <p className="text-base font-semibold mb-3">Animate your photos</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 w-36 h-44 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-dashed border-zinc-700 hover:border-zinc-500 transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-3xl text-zinc-400">+</span>
                  <span className="text-xs text-zinc-400">Add photo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhoto(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {referencePreview && (
                  <div className="shrink-0 w-36 h-44 rounded-2xl bg-zinc-900 border border-blue-500/50 overflow-hidden relative">
                    <img
                      src={referencePreview}
                      alt="reference"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handlePhoto(null)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/80 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Templates */}
            <div className="mb-8">
              <p className="text-base font-semibold mb-3">
                Create from Template
              </p>
              {templates.length === 0 ? (
                <p className="text-sm text-zinc-500">Loading templates…</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTemplate(t)}
                      className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all group"
                    >
                      <img
                        src={t.previewAfter}
                        alt={t.label}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-xs font-semibold text-white">
                          {t.label}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Jobs */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-base font-semibold">Your generations</p>
                {jobs.length > 0 && (
                  <span className="text-xs text-zinc-500">
                    {jobs.length} {jobs.length === 1 ? "video" : "videos"}
                  </span>
                )}
              </div>

              {loading ? (
                <p className="text-sm text-zinc-500">Loading…</p>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 bg-zinc-950 border border-zinc-800 rounded-2xl">
                  <div className="text-4xl mb-3 opacity-40">🎬</div>
                  <p className="text-base font-medium mb-1">
                    Shape your scene, start to finish
                  </p>
                  <p className="text-sm text-zinc-500 max-w-md mx-auto px-4">
                    Describe a video. Gyra will generate it in 30–90 seconds.
                    Costs ${VIDEO_COST_USD.toFixed(2)} per video.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs.map((j) => (
                    <div
                      key={j.id}
                      className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden group"
                    >
                      {j.status === "completed" && j.video_url ? (
                        <video
                          src={j.video_url}
                          controls
                          loop
                          muted
                          playsInline
                          className="w-full aspect-video object-cover bg-black"
                        />
                      ) : (
                        <div className="w-full aspect-video flex items-center justify-center bg-zinc-900">
                          {j.status === "error" ? (
                            <div className="text-center px-4">
                              <p className="text-xs text-red-400 mb-1">
                                Generation failed
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                {j.error || "Unknown error"}
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs text-zinc-500">
                                {j.status === "queued"
                                  ? "Queued…"
                                  : "Generating…"}
                              </span>
                              <span className="text-[10px] text-zinc-600">
                                ~30–90s
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-3 flex items-start justify-between gap-3">
                        <p className="text-xs text-zinc-400 line-clamp-2 flex-1">
                          {j.prompt}
                        </p>
                        {j.status === "completed" && j.video_url && (
                          <button
                            onClick={() =>
                              downloadVideo(j.video_url!, j.prompt)
                            }
                            className="shrink-0 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
                            title="Download"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                            Save
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "ask" && (
          <div className="max-w-2xl mx-auto px-4 py-10 text-center">
            <p className="text-zinc-500 text-sm">Ask mode — coming soon.</p>
          </div>
        )}

        {tab === "build" && (
          <div className="max-w-2xl mx-auto px-4 py-10 text-center">
            <p className="text-zinc-500 text-sm">Build mode — coming soon.</p>
          </div>
        )}
      </div>

      {/* Prompt bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800/50 bg-black/95 backdrop-blur px-4 py-3">
        <div className="max-w-3xl mx-auto">
          {!prompt && !generating && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
              {SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="shrink-0 text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-full text-zinc-400 hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-3 flex flex-col gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Type to imagine…"
              className="bg-transparent outline-none text-base text-white placeholder:text-zinc-500 w-full px-2"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 bg-zinc-800 px-3 py-1.5 rounded-full text-xs text-zinc-300">
                  🎬 Video
                </span>
                <span className="flex items-center gap-1 bg-zinc-800 px-3 py-1.5 rounded-full text-xs text-zinc-300">
                  720p
                </span>
                <span className="flex items-center gap-1 bg-zinc-800 px-3 py-1.5 rounded-full text-xs text-blue-300">
                  💎 ${VIDEO_COST_USD.toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => submit()}
                disabled={generating || !prompt.trim()}
                className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors disabled:opacity-40"
              >
                {generating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="white"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 12h14M12 5l7 7-7 7"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template modal */}
      {activeTemplate && (
        <TemplateModal
          template={activeTemplate}
          onClose={() => setActiveTemplate(null)}
          onUse={(finalPrompt, imageBase64) => {
            setActiveTemplate(null);
            submit(finalPrompt, imageBase64);
          }}
        />
      )}

      {/* Paywall */}
      {showPaywall && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-5 mx-auto">
              <span className="text-2xl">
                {paywallReason === "credits" ? "💎" : "⚡"}
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-3">
              {paywallReason === "credits"
                ? "Not enough credits"
                : "SuperGyra required"}
            </h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              {paywallReason === "credits"
                ? `Video generation costs $${VIDEO_COST_USD.toFixed(
                    2
                  )} per request. Your current balance is $${credits.toFixed(
                    2
                  )}. Top up your wallet to continue.`
                : "Video generation is a SuperGyra feature. Upgrade to unlock video, voice, and more."}
            </p>
            <Link
              href={paywallReason === "credits" ? "/credits" : "/upgrade"}
              className="block bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors w-full mb-3"
            >
              {paywallReason === "credits"
                ? "Add credits →"
                : "Upgrade to SuperGyra →"}
            </Link>
            <button
              onClick={() => setShowPaywall(false)}
              className="text-zinc-500 hover:text-white text-sm transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </main>
  );
}