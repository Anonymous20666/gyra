import Link from "next/link";
import { Suspense } from "react";
import { BookOpen } from "lucide-react";
import { PlatformShell } from "../components/platform/PlatformShell";
import { PlaygroundClient } from "../components/playground/PlaygroundClient";

export const metadata = {
  title: "Playground — Gyra",
  description:
    "Experiment with Gyra Chat, Image, Video, and side-by-side Model Comparison in one unified AI workspace.",
};

export default function PlaygroundPage() {
  return (
    <PlatformShell
      title="AI Playground"
      description="Configure models, stream prompts, synthesize media, and compare outputs live."
      fullBleed
      actions={
        <Link
          href="/docs"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#0B1219] text-[12px] font-medium text-[#0B1220] dark:text-[#F8FAFC] hover:border-[#1F5B7C] dark:hover:border-[#5B9EC2] transition-colors"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">API Docs</span>
        </Link>
      }
    >
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center text-[13px] text-[#64748B] dark:text-white/50">
            Loading Playground...
          </div>
        }
      >
        <PlaygroundClient />
      </Suspense>
    </PlatformShell>
  );
}
