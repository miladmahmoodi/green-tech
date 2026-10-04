"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

function useTween(value: number) {
  const [display, setDisplay] = useState(value);
  const current = useRef(value);
  useEffect(() => {
    const from = current.current;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / 450);
      const eased = 1 - (1 - progress) ** 3;
      const next = from + (value - from) * eased;
      current.current = next;
      setDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return display;
}

export function KpiCard({ label, value, display, hint, tone = "default", size = "default" }: { label: string; value: number; display: (value: number) => string; hint?: string; tone?: "default" | "green" | "blue" | "violet"; size?: "default" | "compact" | "hero" }) {
  const tweened = useTween(value);
  const toneClass = { default: "text-zinc-900 dark:text-zinc-50", green: "text-emerald-600 dark:text-emerald-400", blue: "text-blue-600 dark:text-blue-400", violet: "text-violet-600 dark:text-violet-400" }[tone];
  const figure = size === "hero" ? "mt-3 text-5xl" : size === "compact" ? "mt-1 text-lg" : "mt-2 text-2xl";
  return (
    <article className={cn("rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900", size === "compact" ? "px-3 py-2.5" : "px-4 py-3")}>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className={cn("num font-medium tracking-tight", figure, toneClass)}>{display(tweened)}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </article>
  );
}
