"use client";

import { useEffect } from "react";

/**
 * Coordinates the zero-flash SaaS boot splash rendered immediately in index.html (#gyra-boot-splash).
 * Advances progress cleanly once fonts and page load settle, lifts out smoothly via compositor
 * opacity + scale, and removes the overlay from DOM without ever re-triggering on tab switches.
 */
export function GyraPreloader() {
  useEffect(() => {
    const splash = document.getElementById("gyra-boot-splash");
    if (!splash) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("autostart") === "1" || params.get("nopreload") === "1") {
      splash.remove();
      return;
    }

    const bar = document.getElementById("gyra-boot-bar");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const mountTime = performance.now();
    const minDisplayMs = reducedMotion ? 100 : 620;
    const maxDisplayMs = reducedMotion ? 220 : 1250;

    let dismissed = false;
    let progressTimer: number | null = null;
    let removeTimer: number | null = null;
    let maxCapTimer: number | null = null;

    if (bar) {
      bar.style.transform = "scaleX(0.64)";
    }

    const finishBoot = () => {
      if (dismissed) return;
      dismissed = true;
      if (maxCapTimer !== null) window.clearTimeout(maxCapTimer);
      if (progressTimer !== null) window.clearTimeout(progressTimer);

      if (bar) {
        bar.style.transform = "scaleX(1)";
      }

      const exitDelay = reducedMotion ? 30 : 150;
      const fadeDuration = reducedMotion ? 50 : 360;

      progressTimer = window.setTimeout(() => {
        splash.classList.add("gyra-boot-exit");
        removeTimer = window.setTimeout(() => {
          splash.remove();
        }, fadeDuration);
      }, exitDelay);
    };

    const scheduleFinish = () => {
      const elapsed = performance.now() - mountTime;
      const waitMs = Math.max(0, minDisplayMs - elapsed);
      progressTimer = window.setTimeout(finishBoot, waitMs);
    };

    // Wait for fonts + critical document load, bounded by maxDisplayMs so slow links never stall
    const fontsReady =
      typeof document.fonts?.ready?.then === "function"
        ? document.fonts.ready.catch(() => {})
        : Promise.resolve();

    const docLoaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            window.addEventListener("load", () => resolve(), { once: true });
          });

    Promise.all([fontsReady, docLoaded]).then(scheduleFinish);
    maxCapTimer = window.setTimeout(finishBoot, maxDisplayMs);

    return () => {
      if (progressTimer !== null) window.clearTimeout(progressTimer);
      if (removeTimer !== null) window.clearTimeout(removeTimer);
      if (maxCapTimer !== null) window.clearTimeout(maxCapTimer);
    };
  }, []);

  return null;
}
