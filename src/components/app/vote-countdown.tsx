"use client";

import { useEffect, useState } from "react";

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/** Live countdown to a deadline; calls onExpire once when it hits zero (caller refetches). */
export function VoteCountdown({
  deadline,
  onExpire,
  prefix,
}: {
  deadline: string;
  onExpire?: () => void;
  prefix?: string;
}) {
  const target = new Date(deadline).getTime();
  const [left, setLeft] = useState(() => target - Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      const d = target - Date.now();
      setLeft(d);
      if (d <= 0) {
        clearInterval(t);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [target, onExpire]);

  return (
    <span className="tabular-nums">
      {prefix ? `${prefix} ` : ""}
      {left <= 0 ? "finalizing…" : `${fmt(left)} left`}
    </span>
  );
}
