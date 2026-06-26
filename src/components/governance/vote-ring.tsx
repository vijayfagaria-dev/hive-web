"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Tone = "live" | "passed" | "rejected" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  live: "text-primary",
  passed: "text-sky-500",
  rejected: "text-destructive",
  neutral: "text-muted-foreground",
};

/** Animated SVG progress ring — sweeps to `pct` on mount (respects reduced motion).
 *  The server decides pass/fail, so there's no threshold tick — colour comes from `tone`. */
export function VoteRing({
  pct,
  tone = "neutral",
  size = 76,
  stroke = 8,
  className,
}: {
  pct: number;
  tone?: Tone;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- snap to value when motion is reduced
      setShown(pct);
      return;
    }
    const t = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(t);
  }, [pct]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, shown)) / 100) * c;

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={c}
          strokeDashoffset={off}
          className={cn(
            "transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none",
            TONE_CLASS[tone],
          )}
        />
      </svg>
      <span
        className="absolute inset-0 grid place-items-center font-mono text-sm font-bold tabular-nums"
        aria-label={`${Math.round(pct)} percent support`}
      >
        {Math.round(pct)}%
      </span>
    </div>
  );
}
