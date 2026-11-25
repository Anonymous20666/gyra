"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Film,
  Maximize2,
  Music,
  Play,
  RefreshCw,
  Search,
  Volume2,
  X,
} from "lucide-react";
import type { StreamMetrics } from "../../lib/streaming";
import type { DetectedResponsePayload } from "../../lib/validation";
import { LiveStreamVisualizer } from "./LiveStreamVisualizer";

interface MediaResultViewerProps {
  detected: DetectedResponsePayload;
  streaming: boolean;
  isSamplePreview: boolean;
  streamMetrics?: StreamMetrics;
  onPollVideoStatus?: (requestId: string) => void;
}

function formatDurationMs(ms?: number): string {
  if (!ms || ms <= 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatOffsetMs(ms?: number): string {
  if (ms === undefined) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function MediaResultViewer({
  detected,
  streaming,
  isSamplePreview,
  streamMetrics,
  onPollVideoStatus,
}: MediaResultViewerProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [transcriptQuery, setTranscriptQuery] = useState("");
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // 1. Chat Completion (Real-Time Live Stream Visualizer + Smooth Typing)
  if (detected.kind === "chat") {
    return (
      <LiveStreamVisualizer
        text={detected.chatText ?? ""}
        streaming={streaming}
        model={detected.model ?? streamMetrics?.model}
        metrics={streamMetrics}
        isSamplePreview={isSamplePreview}
      />
    );
  }

  // 2. Video Generation & Async Status
  if (detected.kind === "video") {
    return (
      <div className="space-y-4">
        <div className="p-3.5 rounded-md bg-[#09090B] border border-[#1F1F23] flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11.5px] text-[#71717A]">Async Video Job</p>
            <p className="mt-0.5 font-mono text-[13px] text-[#F4F4F5]">
              {detected.requestId ?? "Job queued"} ·{" "}
              <span
                className={
                  detected.jobStatus === "completed"
                    ? "text-emerald-400"
                    : detected.jobStatus === "error"
                      ? "text-red-400"
                      : "text-amber-400"
                }
              >
                {detected.jobStatus ?? "queued"}
              </span>
            </p>
          </div>
          {detected.requestId && onPollVideoStatus && (
            <button
              type="button"
              onClick={() => onPollVideoStatus(detected.requestId!)}
              className="px-3 py-1.5 text-[12px] font-medium bg-[#121215] hover:bg-[#18181B] border border-[#27272A] text-[#F4F4F5] rounded-md inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Poll Status</span>
            </button>
          )}
        </div>

        {detected.videoUrl ? (
          <div className="space-y-2.5">
            <div className="rounded-lg overflow-hidden border border-[#1F1F23] bg-black">
              <video
                src={detected.videoUrl}
                controls
                playsInline
                className="w-full max-h-[340px] object-contain"
              />
            </div>
            <div className="flex items-center justify-end">
              <a
                href={detected.videoUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-[12px] font-medium bg-[#121215] hover:bg-[#18181B] border border-[#27272A] text-[#D4D4D8] rounded-md inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download MP4</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#27272A] bg-[#000000] p-8 text-center">
            <Film className="w-6 h-6 text-[#5B9EC2] mx-auto mb-2.5" strokeWidth={1.75} />
            <p className="text-[13px] font-medium text-[#E4E4E7]">
              {isSamplePreview
                ? "Video Player Ready for Live Render"
                : "Render in progress on Gyra Video 1.0"}
            </p>
            <p className="mt-1 text-[12px] text-[#71717A] max-w-sm mx-auto">
              Once a live render finishes and returns a <code className="text-[#A1A1AA]">videoUrl</code>,
              the inline 720p player and download controls appear here automatically.
            </p>
          </div>
        )}
      </div>
    );
  }

  // 3. Generated Images
  if (detected.kind === "images" && detected.imageUrls) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {detected.imageUrls.map((url, idx) => (
            <div
              key={idx}
              className="group relative rounded-lg overflow-hidden border border-[#1F1F23] bg-[#09090B]"
            >
              <img
                src={url}
                alt={`Generated output ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full aspect-video object-cover"
              />
              <div className="px-3 py-2 flex items-center justify-between text-[12px] border-t border-[#1F1F23]">
                <span className="font-mono text-[#A1A1AA]">Asset #{idx + 1}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(url)}
                    className="text-[#D4D4D8] hover:text-white inline-flex items-center gap-1"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                  <a
                    href={url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#5B9EC2] hover:text-[#7DD3FC] inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {lightboxUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6"
            role="dialog"
            aria-modal="true"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute top-5 right-5 p-2 rounded-md bg-[#09090B] text-[#F4F4F5]"
              aria-label="Close image preview"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxUrl}
              alt="Full-size preview"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[85vh] rounded-lg border border-[#2E2E34]"
            />
          </div>
        )}
      </div>
    );
  }

  // 4. Spotify Music Search Tracks
  if (detected.kind === "music-tracks" && detected.tracks) {
    return (
      <div className="space-y-2.5">
        <p className="text-[12px] text-[#A1A1AA] font-mono tabular-nums">
          {detected.tracks.length} catalog results
        </p>
        <div className="divide-y divide-[#18181B] border border-[#1F1F23] rounded-lg bg-[#09090B] overflow-hidden">
          {detected.tracks.map((track) => (
            <div key={track.id} className="p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {track.coverArt ? (
                    <img
                      src={track.coverArt}
                      alt={track.name}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded object-cover border border-[#1F1F23] shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded bg-[#121215] border border-[#1F1F23] flex items-center justify-center text-[#5B9EC2] shrink-0">
                      <Music className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-[#F4F4F5] truncate">
                      {track.name}
                    </p>
                    <p className="text-[12px] text-[#A1A1AA] truncate">
                      {[track.artists, track.album].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[11.5px] text-[#71717A] tabular-nums">
                    {formatDurationMs(track.durationMs)}
                  </span>
                  {track.externalUrl && (
                    <a
                      href={track.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#5B9EC2] hover:text-[#7DD3FC]"
                      aria-label={`Open ${track.name} on Spotify`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
              {track.previewUrl && (
                <audio controls src={track.previewUrl} className="w-full h-8" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. YouTube Transcript / Audio Transcription
  if (detected.kind === "youtube-transcript" || detected.kind === "audio-transcript") {
    const segments = detected.transcriptSegments ?? [];
    const filtered = segments.filter((s) =>
      s.text.toLowerCase().includes(transcriptQuery.trim().toLowerCase())
    );
    const fullText = detected.transcriptText ?? segments.map((s) => s.text).join(" ");

    const copyTranscript = async () => {
      try {
        await navigator.clipboard.writeText(fullText);
        setCopiedTranscript(true);
        setTimeout(() => setCopiedTranscript(false), 1600);
      } catch {
        // ignore
      }
    };

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {segments.length > 0 ? (
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={transcriptQuery}
                onChange={(e) => setTranscriptQuery(e.target.value)}
                placeholder="Search transcript segments..."
                className="w-full bg-[#09090B] border border-[#1F1F23] rounded-md pl-8 pr-3 py-1.5 text-[12px] text-[#F4F4F5] placeholder-[#71717A] focus:outline-none focus:border-[#5B9EC2]"
              />
            </div>
          ) : (
            <span className="text-[12px] font-medium text-[#A1A1AA]">
              Transcribed Output
            </span>
          )}
          <button
            type="button"
            onClick={copyTranscript}
            className="px-2.5 py-1.5 text-[12px] font-medium bg-[#121215] hover:bg-[#18181B] border border-[#27272A] text-[#D4D4D8] rounded-md inline-flex items-center gap-1.5"
          >
            {copiedTranscript ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedTranscript ? "Copied" : "Copy Transcript"}</span>
          </button>
        </div>

        {segments.length > 0 ? (
          <div className="divide-y divide-[#18181B] border border-[#1F1F23] rounded-lg bg-[#09090B] max-h-[340px] overflow-y-auto">
            {filtered.map((seg, i) => (
              <div key={i} className="px-3.5 py-2.5 flex items-start gap-3 text-[13px]">
                <span className="font-mono text-[11px] text-[#5B9EC2] tabular-nums shrink-0 pt-0.5">
                  {formatOffsetMs(seg.offset)}
                </span>
                <p className="text-[#D4D4D8] leading-relaxed">{seg.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg border border-[#1F1F23] bg-[#09090B] text-[13.5px] leading-relaxed text-[#E4E4E7]">
            {fullText}
          </div>
        )}
      </div>
    );
  }

  // 6. YouTube / TikTok Metadata Card
  if (detected.kind === "media-metadata" && detected.metadataCard) {
    const m = detected.metadataCard;
    return (
      <div className="rounded-lg border border-[#1F1F23] bg-[#09090B] overflow-hidden">
        {m.thumbnail && (
          <img
            src={m.thumbnail}
            alt={m.title || "Media preview"}
            referrerPolicy="no-referrer"
            className="w-full max-h-52 object-cover border-b border-[#1F1F23]"
          />
        )}
        <div className="p-4 space-y-2">
          <p className="text-[11.5px] font-mono text-[#5B9EC2]">
            {m.provider ?? "Media oEmbed"}
          </p>
          <h4 className="font-display text-[15px] font-semibold text-[#F4F4F5]">
            {m.title ?? "Untitled media"}
          </h4>
          <p className="text-[12.5px] text-[#A1A1AA]">
            Creator: <span className="text-[#E4E4E7]">{m.author ?? "Unknown"}</span>
            {m.width && m.height ? ` · ${m.width}×${m.height}` : ""}
          </p>
        </div>
      </div>
    );
  }

  // 7. Voice Synthesis Payload
  if (detected.kind === "voice" && detected.voicePayload) {
    const { text, voiceId, note } = detected.voicePayload;
    const playBrowserSpeech = () => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    };

    return (
      <div className="p-4 rounded-lg border border-[#1F1F23] bg-[#09090B] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#F4F4F5]">
            <Volume2 className="w-4 h-4 text-[#5B9EC2]" />
            <span>Voice Payload · {voiceId}</span>
          </div>
          <button
            type="button"
            onClick={playBrowserSpeech}
            className="px-3 py-1.5 text-[12px] font-medium bg-[#1F5B7C] hover:bg-[#286F96] text-[#F4F4F5] rounded-md inline-flex items-center gap-1.5"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{speaking ? "Speaking..." : "Play Preview"}</span>
          </button>
        </div>
        <p className="text-[13.5px] text-[#D4D4D8] leading-relaxed">“{text}”</p>
        {note && <p className="text-[11.5px] text-[#71717A]">{note}</p>}
      </div>
    );
  }

  return null;
}
