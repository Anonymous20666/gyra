"use client";

import { useCallback, useRef } from "react";
import type React from "react";

export function usePointerBorder<T extends HTMLElement>() {
  const rafRef = useRef<number | null>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      el.style.setProperty("--mx", `${Math.round(x)}px`);
      el.style.setProperty("--my", `${Math.round(y)}px`);
    });
  }, []);

  const onMouseLeave = useCallback((e: React.MouseEvent<T>) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    e.currentTarget.style.setProperty("--mx", "-400px");
    e.currentTarget.style.setProperty("--my", "-400px");
  }, []);

  return { onMouseMove, onMouseLeave };
}
