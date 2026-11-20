"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookmarkPlus, Download, Film, Loader2, RefreshCw } from "lucide-react";
import { validatePromptInput, type GyraModelSpec } from "../../lib/modelCatalog";

interface VideoJobRow {
  id: string;
  request_id: string;
  prompt: string;
  status: string;
  video_url?: string | null;
  error?: string | null;
  created_at: string;
}

export interface VideoModeWorkspaceProps {
  model: GyraModelSpec;
  params: Record<string, string | number | boolean>;
  draftPrompt: string;
  onChangeDraftPrompt: (val: string) => void;
  onSavePrompt: (prompt: string) => void;
  onRunMeta: (meta: { latencyMs: number; ttftMs: number | null; status: string }) => void;
  accessToken: string | null;
}

export function VideoModeWorkspace({
  model,
  params,
  draftPrompt,
  onChangeDraftPrompt,
  onSavePrompt,
  onRunMeta,
  accessToken,
}: VideoModeWorkspaceProps) {
  const [jobs, setJobs] = useState<VideoJobRow[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const pollRef = useRef<number | null>(null);

  const selectedJob =
    jobs.find((j) => j.request_id === selectedJobId || j.id === selectedJobId) ??
    jobs[0] ??
    null;

  const stopPolling = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const pollJob = (requestId: string) => {
    stopPolling();
    const started = performance.now();
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/video/status/${encodeURIComponent(requestId)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          stopPolling();
          setErrorMsg(data?.error?.message || "Failed to poll video status.");
          return;
        }
        setJobs((prev) =>
          prev.map((j) =>
            j.request_id === requestId
              ? { ...j, status: data.status || j.status, video_url: data.videoUrl || j.video_url }
              : j,
          ),
        );
        if (data.status === "completed") {
          stopPolling();
          onRunMeta({
            latencyMs: Math.round(performance.now() - started),
            ttftMs: null,
            status: "Completed",
          });
        } else if (data.status === "error" || data.status === "failed") {
          stopPolling();
          setErrorMsg("Video job failed upstream. Credits are refunded automatically on rejection.");
        }
      } catch {
        // retry on next tick
      }
    }, 3500);
  };

  const loadHistory = async () => {
    if (!accessToken) {
      setJobs([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/v1/video/history", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
        const active = data.jobs.find(
          (j: VideoJobRow) => j.status === "queued" || j.status === "in_progress",
        );
        if (active) pollJob(active.request_id);
      }
    } catch {
      // keep silent on offline load
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    void loadHistory();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submitting) return;
    const check = validatePromptInput("video", draftPrompt);
    if (!check.ok) {
      setErrorMsg(check.error);
      return;
    }
    if (!accessToken) {
      setErrorMsg("Sign in with a SuperGyra account to queue video renders.");
      return;
    }

    setErrorMsg(null);
    setNeedsUpgrade(false);
    setSubmitting(true);
    const started = performance.now();

    try {
      const aspectRatio = params.aspectRatio === "9:16" ? "9:16" : "16:9";
      const imageBase64 =
        typeof params.imageBase64 === "string" && params.imageBase64.startsWith("data:")
          ? params.imageBase64
          : null;

      const res = await fetch("/api/v1/video/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gyra-user-token": accessToken,
        },
        body: JSON.stringify({
          prompt: check.clean,
          aspectRatio,
          imageBase64,
        }),
      });

      const data = await res.json().catch(() => ({}));
      const latencyMs = Math.round(performance.now() - started);

      if (!res.ok) {
        if (res.status === 402 || res.status === 403) setNeedsUpgrade(true);
        onRunMeta({ latencyMs, ttftMs: null, status: `HTTP ${res.status}` });
        throw new Error(data?.error?.message || `Video queue error (${res.status}).`);
      }

      const newJob: VideoJobRow = {
        id: data.requestId,
        request_id: data.requestId,
        prompt: check.clean,
        status: "queued",
        created_at: new Date().toISOString(),
      };
      setJobs((prev) => [newJob, ...prev]);
      setSelectedJobId(newJob.request_id);
      onRunMeta({ latencyMs, ttftMs: null, status: "Queued" });
      pollJob(newJob.request_id);
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || "Could not queue video generation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-[820px] space-y-5">
          {!accessToken && (
            <div className="flex flex-wrap items-center justify-between gap-3 border border-[#CBD7E3] bg-[#F2F6FA] px-4 py-3 text-[13px] text-[#283B4C] dark:border-white/12 dark:bg-[#070D14] dark:text-[#C4D5E2]">
              <span>
                Video generation runs on <code className="font-mono-tech text-[12px]">{model.id}</code> (720p · 24fps · 5s, SuperGyra + $2.00/render). Sign in to queue jobs and view persisted history.
              </span>
              <Link
                href="/login"
                className="border border-[#1B587A] bg-[#1B587A] px-3 py-1 font-mono-tech text-[11px] text-white uppercase"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Video Player / Status Stage */}
          <div className="border border-[#DCE4EC] bg-white dark:border-white/10 dark:bg-[#04080D]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4ECF3] px-4 py-2.5 dark:border-white/10">
              <div className="font-mono-tech text-[11px] text-[#55697C] dark:text-[#869BAC]">
                {selectedJob ? (
                  <>
                    <span>Job {selectedJob.request_id.slice(0, 12)}</span>
                    <span className="mx-1.5">·</span>
                    <span className="uppercase">{selectedJob.status}</span>
                  </>
                ) : (
                  <span>Video Preview · 720p · 24fps · 121 frames</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {accessToken && (
                  <button
                    type="button"
                    onClick={() => void loadHistory()}
                    className="inline-flex items-center gap-1 font-mono-tech text-[11px] text-[#55697C] hover:text-[#0B1218] dark:text-[#869BAC] dark:hover:text-white"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingHistory ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                )}
                {selectedJob?.video_url && (
                  <a
                    href={selectedJob.video_url}
                    download={`gyra-video-${selectedJob.request_id}.mp4`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 border border-[#D4DFE9] px-2.5 py-1 font-mono-tech text-[11px] text-[#35485A] hover:border-[#1B587A] hover:text-[#0B1218] dark:border-white/12 dark:text-[#B9CAD8] dark:hover:border-[#5B9EC2] dark:hover:text-white"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download MP4</span>
                  </a>
                )}
              </div>
            </div>

            <div className="flex min-h-[320px] items-center justify-center bg-[#F3F6F9] p-5 dark:bg-[#020508]">
              {selectedJob?.video_url ? (
                <div className="w-full space-y-3">
                  <video
                    key={selectedJob.video_url}
                    src={selectedJob.video_url}
                    controls
                    playsInline
                    className="mx-auto max-h-[420px] w-full border border-[#DCE4EC] bg-black dark:border-white/10"
                  />
                  <p className="text-center text-[12.5px] text-[#536678] dark:text-[#8CA0B2]">
                    {selectedJob.prompt}
                  </p>
                </div>
              ) : selectedJob &&
                (selectedJob.status === "queued" || selectedJob.status === "in_progress") ? (
                <div className="text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#1B587A] dark:text-[#5B9EC2]" />
                  <p className="mt-3 font-mono-tech text-[12px] text-[#0B1218] uppercase dark:text-white">
                    Status: {selectedJob.status.replace("_", " ")}
                  </p>
                  <p className="mt-1 max-w-[380px] text-[12.5px] text-[#5A6F82] dark:text-[#8599AB]">
                    Polling <code className="font-mono-tech">/api/v1/video/status/{selectedJob.request_id.slice(0, 10)}...</code> automatically every 3.5s.
                  </p>
                </div>
              ) : (
                <div className="max-w-[420px] text-center">
                  <Film className="mx-auto h-8 w-8 text-[#8BA0B2] dark:text-[#4F6578]" />
                  <p className="mt-3 text-[14px] font-medium text-[#0B1218] dark:text-white">
                    No video renders selected
                  </p>
                  <p className="mt-1 text-[13px] text-[#5B7083] dark:text-[#8599AB]">
                    Select 16:9 or 9:16 and optionally attach a reference keyframe in the right panel, then submit a motion prompt below.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Persisted Video Job History */}
          <div>
            <p className="mb-2 font-mono-tech text-[10.5px] tracking-[0.1em] text-[#586C7E] uppercase dark:text-[#8499AB]">
              Video Queue History ({jobs.length})
            </p>
            {jobs.length === 0 ? (
              <div className="border border-[#DCE4EC] bg-white px-4 py-4 text-[13px] text-[#5C7082] dark:border-white/10 dark:bg-[#04080D] dark:text-[#8499AB]">
                {accessToken
                  ? "No queued or completed video renders found for your account yet."
                  : "Sign in to load your persisted video generation history."}
              </div>
            ) : (
              <div className="divide-y divide-[#E4ECF3] border border-[#DCE4EC] bg-white dark:divide-white/10 dark:border-white/10 dark:bg-[#04080D]">
                {jobs.slice(0, 8).map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedJobId(job.request_id)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                      selectedJob?.request_id === job.request_id
                        ? "bg-[#EDF4F9] dark:bg-[#10202D]"
                        : "hover:bg-[#F7FAFC] dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[#0B1218] dark:text-white">
                        {job.prompt}
                      </p>
                      <p className="mt-0.5 font-mono-tech text-[11px] text-[#5B7083] dark:text-[#8095A8]">
                        {new Date(job.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono-tech text-[11px] uppercase text-[#1B587A] dark:text-[#78B5D8]">
                      {job.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mx-4 mb-2 flex flex-wrap items-center justify-between gap-2 border border-red-300 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800 sm:mx-6 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-200"
        >
          <span>{errorMsg}</span>
          {needsUpgrade && (
            <Link
              href="/upgrade"
              className="border border-current px-2.5 py-1 font-mono-tech text-[11px] uppercase"
            >
              Upgrade / Top Up
            </Link>
          )}
        </div>
      )}

      <form
        onSubmit={handleGenerate}
        className="shrink-0 border-t border-[#DCE4EC] bg-white p-3.5 sm:px-6 dark:border-white/10 dark:bg-[#04080D]"
      >
        <div className="mx-auto max-w-[820px]">
          <textarea
            value={draftPrompt}
            onChange={(e) => onChangeDraftPrompt(e.target.value)}
            rows={2}
            aria-label="Video prompt editor"
            placeholder="Describe camera movement, subject motion, and lighting (max 2,000 chars)..."
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
              disabled={submitting}
              className="inline-flex min-h-[36px] items-center gap-2 border border-[#1B587A] bg-[#1B587A] px-4 py-1.5 font-mono-tech text-[11.5px] font-medium text-white uppercase transition-colors hover:bg-[#154865] disabled:opacity-50 dark:border-[#5B9EC2] dark:bg-[#1F5B7C] dark:hover:bg-[#286D93]"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{submitting ? "Queueing..." : "Queue 720p Video ($2.00)"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
