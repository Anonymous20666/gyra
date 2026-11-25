"use client";

import { useEffect, useState } from "react";

type Props = {
  onUsePrompt: (prompt: string) => void;
};

const STORAGE_KEY = "gyra:onboarding-seen";

const STEPS = [
  {
    title: "Welcome to Gyra",
    body: "Gyra is your intelligent assistant. Ask anything — from quick answers to deep research. Tap anything below to try it.",
    cta: "Next",
  },
  {
    title: "Think, Search, Voice",
    body: "Tap Think for step-by-step reasoning. Tap Search for live web results. Tap the mic for hands-free voice chat.",
    cta: "Next",
  },
  {
    title: "Start with a prompt",
    body: "New to AI chat? Pick one of these to get a feel for what Gyra can do. You can always type your own too.",
    cta: "Start chatting",
  },
];

const SUGGESTED = [
  "Explain quantum computing like I'm 5",
  "Write a cold email to a potential client",
  "Summarize this article: [paste URL or text]",
  "Help me plan a 3-day trip to Lagos",
  "Debug this JavaScript error: [paste code]",
  "Give me 10 business ideas for Nigeria",
];

export default function OnboardingModal({ onUsePrompt }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        timer = setTimeout(() => setOpen(true), 0);
      }
    } catch {}
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setOpen(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else dismiss();
  };

  if (!open) return null;

  const current = STEPS[step];

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-lg w-full">
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step
                  ? "w-8 bg-blue-500"
                  : i < step
                  ? "w-4 bg-blue-500/50"
                  : "w-4 bg-zinc-800"
              }`}
            />
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-3">{current.title}</h2>
        <p className="text-zinc-400 leading-relaxed mb-6">{current.body}</p>

        {step === 2 && (
          <div className="flex flex-col gap-2 mb-6 max-h-72 overflow-y-auto">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => {
                  onUsePrompt(s);
                  dismiss();
                }}
                className="text-left text-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-3 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={dismiss}
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Skip
          </button>
          <button
            onClick={next}
            className="bg-white text-black px-6 py-2.5 rounded-full font-medium hover:bg-zinc-200 transition-colors"
          >
            {current.cta}
          </button>
        </div>
      </div>
    </div>
  );
}