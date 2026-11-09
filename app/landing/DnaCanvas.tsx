"use client";

import { useEffect, useRef } from "react";

/**
 * Living DNA backdrop for the hero.
 *
 * Two strands of a double helix flow vertically through the hero, connected
 * by rungs and glowing nodes, with light pulses that travel along the
 * structure. The motion is continuous and organic (amplitude "breathes",
 * columns drift slowly), reacts to the pointer and to scroll, and keeps
 * the left text area clean.
 *
 * Performance & accessibility:
 *  - DPR capped at 1.75, ~150 draw primitives per frame
 *  - paused entirely when offscreen
 *  - static single frame under prefers-reduced-motion
 *  - pure canvas 2D — no 3D, no extra libraries
 *
 * Must be a child of the hero section (position:relative); it sizes itself
 * to its parent.
 */

type Pulse = {
  pos: number; // 0..1 along the strand
  speed: number; // slow cycles
  len: number; // pulse length (fraction of strand)
  dir: 1 | -1;
};

function makePulses(count: number, seed: number): Pulse[] {
  const out: Pulse[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      pos: (seed * 0.37 + i * 0.31) % 1,
      speed: 0.026 + ((i * 13 + Math.floor(seed * 7)) % 5) * 0.006,
      len: 0.05 + ((i * 11 + seed) % 4) * 0.012,
      dir: i % 2 === 0 ? 1 : -1,
    });
  }
  return out;
}

export default function DnaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.parentElement;
    if (!canvas || !hero) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(hover: none)").matches;
    const isMobile = window.innerWidth < 768;

    let w = 0;
    let h = 0;

    // interaction state (lerped toward targets)
    const mouse = { x: 0.62, y: 0.5, tx: 0.62, ty: 0.5, active: false };
    const scroll = { y: 0, sy: 0 };

    // helix columns: main column + two faint depth columns
    const cols = [
      { cx: 0.72, amp: 0.115, scale: 1, alpha: 1, violet: false },
      { cx: 0.46, amp: 0.075, scale: 0.72, alpha: 0.4, violet: true },
      { cx: 0.9, amp: 0.05, scale: 0.55, alpha: 0.3, violet: false },
    ];
    const pulses: Pulse[][] = [makePulses(3, 1), makePulses(2, 2), makePulses(2, 3)];

    function resize() {
      const r = hero!.getBoundingClientRect();
      w = Math.max(1, Math.floor(r.width));
      h = Math.max(1, Math.floor(r.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) draw(0);
    }

    function strandX(cx: number, amp: number, scale: number, wy: number, t: number, colPhase: number) {
      const breathe =
        1 + 0.09 * Math.sin(t * 0.5 + colPhase) + 0.05 * Math.sin(t * 0.23 + wy * 0.004 + colPhase);
      const drift = (6 * Math.sin(t * 0.19 + colPhase * 2)) / Math.max(1, w);
      return (cx + drift) * w + amp * w * scale * breathe * Math.sin(wy * 0.011 + t * 0.55 + colPhase);
    }
    function strandDepth(colPhase: number, wy: number, t: number) {
      return Math.cos(wy * 0.011 + t * 0.55 + colPhase); // -1..1, 1 = toward viewer
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, w, h);

      const fade = Math.max(0, 1 - scroll.sy / (h * 0.9));
      if (fade <= 0.01) return;

      const px = mouse.active ? (mouse.x - 0.5) * 2 * 22 : 0;
      const py = mouse.active ? (mouse.y - 0.5) * 2 * 14 : 0;
      const yShift = scroll.sy * 0.22;

      const step = 12; // px between strand sample points
      const rungGap = 34; // px between rungs

      for (let ci = cols.length - 1; ci >= 0; ci--) {
        const col = cols[ci];
        const colPhase = ci * 2.1;
        const baseAlpha = col.alpha * fade * (isMobile && ci !== 0 ? 0.5 : 1);
        const [cr, cg, cb] = col.violet ? [139, 131, 255] : [72, 220, 229];

        // --- rungs (behind strands) ---
        const start = -40 + ((yShift % rungGap) + rungGap) % rungGap;
        for (let y = start; y < h + 40; y += rungGap) {
          const wy = y - yShift;
          const d = strandDepth(colPhase, wy, t);
          const rungAlpha = (0.14 + 0.2 * Math.max(0, d)) * baseAlpha;
          if (rungAlpha < 0.02) continue;
          const xA = strandX(col.cx, col.amp, col.scale, wy, t, colPhase) + px * col.scale;
          const xB = strandX(col.cx, col.amp, col.scale, wy, t, colPhase + Math.PI) + px * col.scale;
          const ny = y + py * col.scale;
          ctx!.strokeStyle = `rgba(${cr},${cg},${cb},${rungAlpha.toFixed(3)})`;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.moveTo(xA, ny);
          ctx!.lineTo(xB, ny);
          ctx!.stroke();

          // node at the rung end facing the viewer
          const frontA = d > 0;
          const nx = frontA ? xA : xB;
          const nodeAlpha = (0.3 + 0.5 * Math.abs(d)) * baseAlpha;
          if (nodeAlpha > 0.05) {
            ctx!.beginPath();
            ctx!.fillStyle = col.violet
              ? `rgba(170,165,255,${nodeAlpha.toFixed(3)})`
              : `rgba(150,235,240,${nodeAlpha.toFixed(3)})`;
            ctx!.arc(nx, ny, 1.3 + 1.7 * Math.abs(d) * col.scale, 0, Math.PI * 2);
            ctx!.fill();
          }
        }

        // --- strands: sample once, stroke two passes (front/back) ---
        const pts: { x0: number; x1: number; y: number; d: number }[] = [];
        for (let y = -30; y < h + 30; y += step) {
          const wy = y - yShift;
          const d = strandDepth(colPhase, wy, t);
          pts.push({
            x0: strandX(col.cx, col.amp, col.scale, wy, t, colPhase) + px * col.scale,
            x1: strandX(col.cx, col.amp, col.scale, wy, t, colPhase + Math.PI) + px * col.scale,
            y: y + py * col.scale,
            d,
          });
        }
        for (let pass = 0; pass < 2; pass++) {
          ctx!.beginPath();
          for (let i = 0; i < pts.length; i++) {
            const x = pass === 0 ? pts[i].x0 : pts[i].x1;
            if (i === 0) ctx!.moveTo(x, pts[i].y);
            else ctx!.lineTo(x, pts[i].y);
          }
          let depthSum = 0;
          for (const p of pts) depthSum += p.d * (pass === 0 ? 1 : -1);
          const avg = depthSum / Math.max(1, pts.length);
          const a = (0.26 + 0.36 * (avg * 0.5 + 0.5)) * baseAlpha;
          ctx!.strokeStyle = `rgba(${cr},${cg},${cb},${a.toFixed(3)})`;
          ctx!.lineWidth = (pass === 0 ? 1.7 : 1.2) * col.scale + 0.3;
          ctx!.lineCap = "round";
          ctx!.stroke();
        }

        // --- travelling light pulses ---
        const span = h + 80;
        for (const pl of pulses[ci]) {
          const p = (((pl.pos + t * pl.speed * pl.dir) % 1) + 1) % 1;
          const py2 = p * span - 40 - yShift;
          if (py2 < -60 || py2 > h + 60) continue;
          for (let s = 0; s < 2; s++) {
            const wy = py2 + yShift;
            const x = strandX(col.cx, col.amp, col.scale, wy, t, colPhase + s * Math.PI) + px * col.scale;
            const d = strandDepth(colPhase + s * Math.PI, wy, t);
            const glow = (0.45 + 0.55 * Math.max(0, d)) * baseAlpha;
            if (glow < 0.06) continue;
            const ny = py2 + py * col.scale;
            // halo
            const r = 10 * col.scale + 4;
            const g = ctx!.createRadialGradient(x, ny, 0, x, ny, r);
            g.addColorStop(0, `rgba(${cr},${cg},${cb},${(0.3 * glow).toFixed(3)})`);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx!.fillStyle = g;
            ctx!.beginPath();
            ctx!.arc(x, ny, r, 0, Math.PI * 2);
            ctx!.fill();
            // bright core
            ctx!.beginPath();
            ctx!.fillStyle = `rgba(235,255,255,${(0.85 * glow).toFixed(3)})`;
            ctx!.arc(x, ny, 1.5 * col.scale + 0.6, 0, Math.PI * 2);
            ctx!.fill();
            // short bright segment trailing along the strand
            const seg = pl.len * span;
            const wyEnd = wy - pl.dir * seg * 0.4;
            const xEnd = strandX(col.cx, col.amp, col.scale, wyEnd, t, colPhase + s * Math.PI) + px * col.scale;
            ctx!.beginPath();
            ctx!.strokeStyle = `rgba(190,246,248,${(0.45 * glow).toFixed(3)})`;
            ctx!.lineWidth = 1.8 * col.scale + 0.4;
            ctx!.moveTo(x, ny);
            ctx!.lineTo(xEnd, ny - pl.dir * seg * 0.4);
            ctx!.stroke();
          }
        }
      }
    }

    // ---------- loop control ----------
    let raf = 0;
    let running = false;
    const startTs = performance.now();

    function frame(ts: number) {
      const t = (ts - startTs) / 1000;
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      scroll.sy += (scroll.y - scroll.sy) * 0.1;
      draw(t);
      if (running) raf = requestAnimationFrame(frame);
    }
    function start() {
      if (running || reduced) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    // pause offscreen
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) start();
          else stop();
        });
      },
      { threshold: 0.04 }
    );
    io.observe(hero);

    function onScroll() {
      scroll.y = window.scrollY;
    }
    function onMove(e: PointerEvent) {
      if (touch || reduced) return;
      mouse.active = true;
      mouse.tx = e.clientX / Math.max(1, window.innerWidth);
      mouse.ty = e.clientY / Math.max(1, h);
    }
    function onLeave() {
      mouse.active = false;
      mouse.tx = 0.62;
      mouse.ty = 0.5;
    }

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        if (!running) start();
      }, 150);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    hero.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);

    onScroll();
    resize();
    if (!reduced) start();
    else draw(0);

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, []);

  return <canvas ref={canvasRef} className="gy-dna-canvas" aria-hidden />;
}
