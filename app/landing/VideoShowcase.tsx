"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";

/**
 * Media Studio — cinematic rolling gallery (round 4).
 *
 * A transform-driven track with real momentum: drag/swipe velocity carries
 * the row, friction decays it, and it settles softly onto the nearest card
 * (no harsh snapping). While idle it drifts slowly to the next card and
 * ping-pongs at the ends. Cards near the centre get a subtle depth treatment
 * (scale + brightness + a whisper of perspective). Videos are muted, looping
 * and IO-managed: ≤3 decode concurrently on desktop, the active card only on
 * mobile. No play buttons, no sound controls — the previews are silent by
 * design. reduced motion: no drift, no depth, no autoplay-of-movement;
 * dragging still works.
 */

type Item = {
  id: string;
  src: string;
  poster: string;
  title: string;
  meta: string;
  badge: "live" | "sample";
  aspect: number; // native w/h
};

const ITEMS: Item[] = [
  {
    id: "rec-1",
    src: "/media/rec-1.webm",
    poster: "/media/poster-rec-1.jpg",
    title: "The agent team plans",
    meta: "Recorded live · this site",
    badge: "live",
    aspect: 1.6,
  },
  {
    id: "api",
    src: "/media/api-hero-bg.mp4",
    poster: "/media/poster-api.png",
    title: "Cinematic product shot",
    meta: "Engine output · 6s",
    badge: "sample",
    aspect: 736 / 400,
  },
  {
    id: "rec-2",
    src: "/media/rec-2.webm",
    poster: "/media/poster-rec-2.jpg",
    title: "Writing the component",
    meta: "Recorded live · this site",
    badge: "live",
    aspect: 1.6,
  },
  {
    id: "docs",
    src: "/media/docs-hero-bg.mp4",
    poster: "/media/poster-docs.png",
    title: "Product visual",
    meta: "Engine output · 8s",
    badge: "sample",
    aspect: 478 / 850,
  },
  {
    id: "rec-3",
    src: "/media/rec-3.webm",
    poster: "/media/poster-rec-3.jpg",
    title: "Preview is live",
    meta: "Recorded live · this site",
    badge: "live",
    aspect: 1.6,
  },
];

function cardSize(item: Item, mobile: boolean): { w: number; h: number } {
  const h = mobile ? 250 : 340;
  let w = Math.round(h * item.aspect);
  const maxW = mobile ? Math.round(window.innerWidth * 0.86) : 620;
  w = Math.max(mobile ? 200 : 210, Math.min(maxW, w));
  return { w, h };
}

export default function VideoShowcase() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const vpRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const posterRefs = useRef<(HTMLImageElement | null)[]>([]);

  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>(() => ITEMS.map(() => false));
  const [failed, setFailed] = useState<boolean[]>(() => ITEMS.map(() => false));
  const [mobile, setMobile] = useState(false);
  const [reduced, setReduced] = useState(false);

  // engine state (refs — the rAF loop owns them)
  const xRef = useRef(0);
  const vRef = useRef(0);
  const settleRef = useRef<number | null>(null);
  const dragRef = useRef<{ id: number; lastX: number; lastT: number; v: number; moved: number; horiz: boolean } | null>(null);
  const lastInteractRef = useRef(Date.now());
  const driftDirRef = useRef(1);
  const geomRef = useRef<{ centers: number[]; max: number; vpW: number }>({ centers: [], max: 0, vpW: 0 });
  const activeRef = useRef(0);
  const reducedRef = useRef(false);
  const mobileRef = useRef(false);
  const playingRef = useRef<Set<number>>(new Set());

  const markInteract = () => {
    lastInteractRef.current = Date.now();
    settleRef.current = null;
  };

  const measure = useCallback(() => {
    const vp = vpRef.current, track = trackRef.current;
    if (!vp || !track) return;
    const vpW = vp.clientWidth;
    const centers: number[] = [];
    cardRefs.current.forEach((c) => {
      if (c) centers.push(c.offsetLeft + c.offsetWidth / 2);
    });
    const max = Math.max(0, track.scrollWidth - vpW);
    geomRef.current = { centers, max, vpW };
    xRef.current = Math.min(Math.max(0, xRef.current), max);
    const isMobile = vpW < 700;
    if (isMobile !== mobileRef.current) {
      mobileRef.current = isMobile;
      setMobile(isMobile);
    }
  }, []);

  const nearestCenter = useCallback((x: number) => {
    const { centers, vpW } = geomRef.current;
    if (!centers.length) return x;
    const focal = x + vpW / 2;
    let best = centers[0], bd = Infinity;
    for (const c of centers) {
      const d = Math.abs(c - focal);
      if (d < bd) { bd = d; best = c; }
    }
    return best - vpW / 2;
  }, []);

  // ---- video playback management (IO per video, concurrency budget) ----
  useEffect(() => {
    const vp = vpRef.current, section = sectionRef.current;
    if (!vp || !section) return;
    const budget = mobileRef.current ? 1 : 3;
    const ios: IntersectionObserver[] = [];
    ITEMS.forEach((_, i) => {
      const v = videoRefs.current[i];
      if (!v) return;
      const io = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (e.isIntersecting && e.intersectionRatio >= 0.5) {
              const set = playingRef.current;
              if (set.size < budget || set.has(i)) {
                if (!set.has(i)) {
                  // evict the farthest non-active from the budget
                  if (set.size >= budget) {
                    const { centers, vpW } = geomRef.current;
                    const focal = xRef.current + vpW / 2;
                    let far = -1, fd = -1;
                    set.forEach((j) => {
                      if (j === i || j === activeRef.current) return;
                      const d = Math.abs((centers[j] || 0) - focal);
                      if (d > fd) { fd = d; far = j; }
                    });
                    if (far >= 0) {
                      videoRefs.current[far]?.pause();
                      set.delete(far);
                    }
                  }
                  v.play().then(() => set.add(i)).catch(() => {});
                }
              }
            } else {
              const set = playingRef.current;
              if (set.has(i)) {
                videoRefs.current[i]?.pause();
                set.delete(i);
              }
            }
          }),
        { root: vp, threshold: [0, 0.5, 0.9] }
      );
      io.observe(v);
      ios.push(io);
    });
    // section-level: pause everything when the studio scrolls away
    const sio = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) {
            playingRef.current.forEach((j) => videoRefs.current[j]?.pause());
            playingRef.current.clear();
          }
        }),
      { threshold: 0.05 }
    );
    sio.observe(section);
    return () => { ios.forEach((io) => io.disconnect()); sio.disconnect(); };
  }, [mobile]);

  // ---- the reel engine ----
  useEffect(() => {
    const vp = vpRef.current, track = trackRef.current;
    if (!vp || !track) return;
    let raf = 0;
    let visible = false;
    let last = performance.now();

    const apply = () => {
      track.style.transform = `translate3d(${-xRef.current}px,0,0)`;
      const { centers, vpW } = geomRef.current;
      const doDepth = !reducedRef.current && vpW >= 700;
      let ai = 0, bd = Infinity;
      centers.forEach((c, i) => {
        const el = cardRefs.current[i];
        if (!el) return;
        const d = (c - (xRef.current + vpW / 2)) / Math.max(1, vpW);
        const ad = Math.abs(d);
        if (ad < bd) { bd = ad; ai = i; }
        if (doDepth) {
          const scale = 1 - Math.min(0.045, ad * 0.09);
          const rot = Math.max(-3.5, Math.min(3.5, d * 4.5));
          const bright = 1 - Math.min(0.3, ad * 0.42);
          el.style.transform = `perspective(1000px) rotateY(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
          el.style.filter = `brightness(${bright.toFixed(3)})`;
        } else {
          el.style.transform = "";
          el.style.filter = "";
        }
      });
      if (ai !== activeRef.current) {
        activeRef.current = ai;
        setActive(ai);
      }
    };

    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      if (!visible) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { max, centers, vpW } = geomRef.current;
      const reduced = reducedRef.current;

      if (dragRef.current) {
        // x is set directly by pointermove; settle velocity tracking
        vRef.current = dragRef.current.v;
        return;
      }

      if (Math.abs(vRef.current) > 6) {
        // inertia, then hand off to the soft settle
        xRef.current += vRef.current * dt;
        vRef.current *= Math.pow(0.94, dt * 60);
        if (xRef.current < 0) { xRef.current = 0; vRef.current = 0; }
        if (xRef.current > max) { xRef.current = max; vRef.current = 0; }
        if (Math.abs(vRef.current) <= 6) {
          vRef.current = 0;
          settleRef.current = nearestCenter(xRef.current);
        }
      } else if (settleRef.current !== null) {
        // soft settle onto nearest card
        const target = settleRef.current;
        xRef.current += (target - xRef.current) * Math.min(1, 7 * dt);
        if (Math.abs(target - xRef.current) < 0.6) {
          xRef.current = target;
          settleRef.current = null;
          vRef.current = 0;
        }
      } else {
        // idle drift (never under reduced motion)
        if (!reduced) {
          const idleFor = now - lastInteractRef.current;
          if (idleFor > 8000) {
            const focal = xRef.current + vpW / 2;
            // find next card centre in drift direction
            let target: number | null = null;
            if (driftDirRef.current > 0) {
              for (const c of centers) if (c > focal + 2) { target = c; break; }
              if (target === null) driftDirRef.current = -1;
            } else {
              for (let i = centers.length - 1; i >= 0; i--) if (centers[i] < focal - 2) { target = centers[i]; break; }
              if (target === null) driftDirRef.current = 1;
            }
            if (target !== null) {
              const dest = Math.min(Math.max(0, target - vpW / 2), max);
              xRef.current += (dest > xRef.current ? 1 : -1) * 15 * dt;
              if ((dest - xRef.current) * (dest > xRef.current ? 1 : -1) < 0.5) {
                xRef.current = dest;
                if (xRef.current <= 0.5 || xRef.current >= max - 0.5) driftDirRef.current *= -1;
              }
            }
          }
        }
      }
      xRef.current = Math.min(Math.max(0, xRef.current), max);
      apply();
    };

    const onVis = (es: IntersectionObserverEntry[]) => {
      visible = es[0]?.isIntersecting ?? true;
      if (visible) last = performance.now();
    };
    const io = new IntersectionObserver(onVis, { threshold: 0.05 });
    io.observe(sectionRef.current!);

    // ---- pointer drag ----
    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      vp.setPointerCapture(e.pointerId);
      dragRef.current = { id: e.pointerId, lastX: e.clientX, lastT: performance.now(), v: 0, moved: 0, horiz: false };
      markInteract();
    };
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.lastX;
      const now = performance.now();
      const dt = Math.max(8, now - d.lastT);
      d.lastX = e.clientX;
      d.lastT = now;
      d.moved += Math.abs(dx);
      if (d.moved > 6) d.horiz = true;
      if (d.horiz) {
        vRef.current = (dx / dt) * 1000; // px/s
        d.v = vRef.current;
        const { max } = geomRef.current;
        let nx = xRef.current - dx;
        // rubber edges
        if (nx < 0) nx *= 0.35;
        if (nx > max) nx = max + (nx - max) * 0.35;
        xRef.current = nx;
      }
    };
    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.id) return;
      dragRef.current = null;
      markInteract();
      if (d.horiz && Math.abs(vRef.current) > 40) {
        // momentum carry, then settle
        settleRef.current = null;
      } else {
        settleRef.current = nearestCenter(xRef.current);
        vRef.current = 0;
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        markInteract();
        const { max } = geomRef.current;
        xRef.current = Math.min(Math.max(0, xRef.current + e.deltaX), max);
        vRef.current = 0;
        settleRef.current = nearestCenter(xRef.current);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      markInteract();
      const { centers, vpW } = geomRef.current;
      const focal = xRef.current + vpW / 2;
      const dir = e.key === "ArrowRight" ? 1 : -1;
      let target: number | null = null;
      if (dir > 0) for (const c of centers) if (c > focal + 4) { target = c; break; }
      else for (let i = centers.length - 1; i >= 0; i--) if (centers[i] < focal - 4) { target = centers[i]; break; }
      if (target !== null) {
        vRef.current = 0;
        settleRef.current = Math.min(Math.max(0, target - vpW / 2), geomRef.current.max);
      }
    };

    let rt: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { measure(); apply(); }, 120); };

    measure();
    apply();
    raf = requestAnimationFrame(step);
    vp.addEventListener("pointerdown", onDown);
    vp.addEventListener("pointermove", onMove);
    vp.addEventListener("pointerup", onUp);
    vp.addEventListener("pointercancel", onUp);
    vp.addEventListener("wheel", onWheel, { passive: false });
    vp.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      clearTimeout(rt);
      vp.removeEventListener("pointerdown", onDown);
      vp.removeEventListener("pointermove", onMove);
      vp.removeEventListener("pointerup", onUp);
      vp.removeEventListener("pointercancel", onUp);
      vp.removeEventListener("wheel", onWheel);
      vp.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [measure, nearestCenter]);

  // re-measure when the card grid reflows (mobile ↔ desktop)
  useEffect(() => {
    measure();
  }, [mobile, measure]);

  // reduced motion
  useEffect(() => {
    const apply = () => { reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches; setReduced(reducedRef.current); };
    apply();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  return (
    <section id="media" ref={sectionRef} className="gy-section">
      <div className="gy-section-glow gy-glow-blue" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="gy-section-head">
            <p className="gy-eyebrow" style={{ color: "var(--gy-blue)" }}>
              The media studio, in motion
            </p>
            <h2>Real output, not mockups.</h2>
            <p>
              Short video generation is part of the workspace. The clips below
              are engine outputs from our media pipeline — and full runs
              recorded live on this site while the agent worked.
            </p>
          </div>
        </Reveal>
      </div>

      <Reveal delay={120}>
        <div className="gy-reel">
          <div
            ref={vpRef}
            className="gy-reel-vp"
            role="region"
            aria-roledescription="carousel"
            aria-label="Generated media gallery — drag or swipe to explore"
            data-reduced={reduced ? "true" : undefined}
            tabIndex={0}
          >
            <div ref={trackRef} className="gy-reel-track">
              {ITEMS.map((it, i) => {
                const sz = cardSize(it, mobile);
                return (
                  <figure
                    key={it.id}
                    ref={(el) => { cardRefs.current[i] = el; }}
                    className={`gy-rvcard ${i === active ? "is-active" : ""} ${loaded[i] ? "is-loaded" : ""}`}
                    style={{ width: sz.w, height: sz.h }}
                  >
                    <img
                      ref={(el) => { posterRefs.current[i] = el; }}
                      className="gy-rvposter"
                      src={it.poster}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                    {!failed[i] && (
                      <video
                        ref={(el) => { videoRefs.current[i] = el; }}
                        src={it.src}
                        poster={it.poster}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onCanPlay={() => setLoaded((l) => l.map((v, j) => (j === i ? true : v)))}
                        onError={() => setFailed((f) => f.map((v, j) => (j === i ? true : v)))}
                        className={failed[i] ? "failed" : ""}
                      />
                    )}
                    <figcaption>
                      <span className="ttl">{it.title}</span>
                      <span className="meta">
                        <span
                          className="gy-pill"
                          data-live={it.badge === "live" ? "true" : undefined}
                          style={{ padding: "2px 8px", fontSize: "10px" }}
                        >
                          {it.badge === "live" ? "Live" : "Sample"}
                        </span>
                        <span className="mm">{it.meta}</span>
                      </span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
          <div className="gy-reel-dots" role="tablist" aria-label="Gallery position">
            {ITEMS.map((it, i) => (
              <button
                key={it.id}
                role="tab"
                aria-selected={i === active}
                aria-label={`Go to: ${it.title}`}
                className={i === active ? "on" : ""}
                onClick={() => {
                  markInteract();
                  const { centers, vpW, max } = geomRef.current;
                  vRef.current = 0;
                  settleRef.current = Math.min(Math.max(0, (centers[i] || 0) - vpW / 2), max);
                }}
              />
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
