"use client";

import { useEffect } from "react";

/**
 * GlowFollow — pointer devices only.
 * Sets --mx / --my on the hovered [data-glow] surface so its CSS
 * ::after radial highlight tracks the cursor. rAF-throttled, no layout reads
 * in the hot path beyond one getBoundingClientRect per frame.
 */
export default function GlowFollow() {
  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let el: HTMLElement | null = null;
    let x = 0;
    let y = 0;

    const apply = () => {
      raf = 0;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${(((x - r.left) / r.width) * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(((y - r.top) / r.height) * 100).toFixed(1)}%`);
    };

    const onMove = (e: PointerEvent) => {
      el = ((e.target as Element | null)?.closest?.("[data-glow]") as HTMLElement | null) ?? null;
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
