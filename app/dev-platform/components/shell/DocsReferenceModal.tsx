"use client";

import { ArrowUpRight, X } from "lucide-react";
import {
  GYRA_API_BASE_URL,
  GYRA_ENDPOINTS,
  GYRA_MODELS,
  type GyraEndpointSpec,
} from "../../lib/gyraCatalog";

interface DocsReferenceModalProps {
  open: boolean;
  onClose: () => void;
  onSelectEndpoint: (ep: GyraEndpointSpec) => void;
}

export function DocsReferenceModal({
  open,
  onClose,
  onSelectEndpoint,
}: DocsReferenceModalProps) {
  if (!open) return null;

  const liveEndpoints = GYRA_ENDPOINTS.filter((e) => e.availability === "live");

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Gyra API Reference"
    >
      <div className="fixed inset-0 bg-black/65" onClick={onClose} />
      <aside className="relative z-10 w-full max-w-xl bg-[#000000] border-l border-[#1F1F23] h-full flex flex-col">
        <div className="px-5 py-4 border-b border-[#1F1F23] flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[15px] font-semibold text-[#F4F4F5]">
              Gyra API Reference
            </h2>
            <p className="text-[12px] font-mono text-[#71717A] mt-0.5">
              Base URL: {GYRA_API_BASE_URL}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#71717A] hover:text-[#F4F4F5] rounded-md"
            aria-label="Close API reference"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <h3 className="font-display text-[13.5px] font-semibold text-[#F4F4F5] mb-2">
              Authentication Headers
            </h3>
            <div className="bg-[#09090B] border border-[#1F1F23] rounded-md p-3.5 space-y-2 text-[12.5px] text-[#A1A1AA]">
              <p>
                <strong className="text-[#E4E4E7]">AI &amp; Media APIs:</strong> Send{" "}
                <code className="text-[#7DD3FC]">Authorization: Bearer gyra_...</code> or{" "}
                <code className="text-[#7DD3FC]">Bearer gyramedia_...</code>
              </p>
              <p>
                <strong className="text-[#E4E4E7]">Video &amp; Session-Scoped Routes:</strong> Send{" "}
                <code className="text-[#7DD3FC]">x-gyra-user-token: &lt;session_jwt&gt;</code>
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-display text-[13.5px] font-semibold text-[#F4F4F5] mb-2">
              Live Endpoints ({liveEndpoints.length})
            </h3>
            <div className="divide-y divide-[#18181B] border border-[#1F1F23] rounded-md bg-[#09090B]">
              {liveEndpoints.map((ep) => (
                <div
                  key={ep.id}
                  className="p-3.5 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-mono text-[12px]">
                      <span
                        className={
                          ep.method === "GET"
                            ? "text-emerald-400 font-semibold"
                            : "text-[#5B9EC2] font-semibold"
                        }
                      >
                        {ep.method}
                      </span>
                      <span className="text-[#F4F4F5] truncate">{ep.path}</span>
                    </div>
                    <p className="mt-1 text-[12px] text-[#A1A1AA]">
                      {ep.shortDescription}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectEndpoint(ep);
                      onClose();
                    }}
                    className="text-[12px] font-medium text-[#5B9EC2] hover:text-[#7DD3FC] inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <span>Try</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-[13.5px] font-semibold text-[#F4F4F5] mb-2">
              Available Models
            </h3>
            <div className="space-y-2">
              {GYRA_MODELS.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-md bg-[#09090B] border border-[#1F1F23]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-[#F4F4F5]">{m.name}</span>
                    <code className="text-[11.5px] text-[#5B9EC2]">{m.id}</code>
                  </div>
                  <p className="mt-1 text-[12px] text-[#A1A1AA]">{m.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
