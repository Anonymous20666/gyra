"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Scroll-reveal wrapper. Fade + rise, transform/opacity only,
 * fires once, respects prefers-reduced-motion.
 *
 * Progressive enhancement: the hidden state is only applied while JS is
 * active (html.gy-js). Without JS the content is simply visible.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Enable the JS-gated hidden state exactly once, site-wide.
    document.documentElement.classList.add("gy-js");

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setInView(true);
      return;
    }

    // If the element is already in the viewport, reveal immediately.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.92 && r.bottom > 0) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);

    // Safety net: never leave content hidden (e.g. IO quirks, scroll jank).
    const failsafe = setTimeout(() => setInView(true), 8000);
    return () => {
      io.disconnect();
      clearTimeout(failsafe);
    };
  }, []);

  const Comp = Tag as any;
  return (
    <Comp
      ref={ref as any}
      className={`gy-reveal ${inView ? "gy-in" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Comp>
  );
}
