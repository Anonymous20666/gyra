"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cursor-reactive ambient light: a soft cyan radial glow that trails the
 * pointer with easing. Desktop (hover-capable) only, motion-safe only.
 * Pure transform updates — no layout, no painting.
 */
export default function CursorLight() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    setEnabled(true);
    const el = ref.current;
    if (!el) return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight * 0.3;
    let x = tx;
    let y = ty;
    let raf = 0;
    let shown = false;

    function onMove(e: PointerEvent) {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        x = tx;
        y = ty;
        el!.classList.add("gy-on");
      }
    }
    function onLeave() {
      shown = false;
      el!.classList.remove("gy-on");
    }
    function loop() {
      x += (tx - x) * 0.11;
      y += (ty - y) * 0.11;
      el!.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div ref={ref} className="gy-cursor-light" aria-hidden />;
}
