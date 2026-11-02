"use client";

import { useCallback, useEffect, useState } from "react";

/** Seconds left until a deadline set via `start(seconds)`; ticks once a second.
 *  Anchored to an absolute time so a backgrounded tab catches up correctly. */
export function useCountdown(initialSeconds = 0) {
  const [deadline, setDeadline] = useState(() => Date.now() + initialSeconds * 1000);
  const [left, setLeft] = useState(initialSeconds);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [deadline]);

  const start = useCallback((seconds: number) => setDeadline(Date.now() + seconds * 1000), []);
  return [left, start] as const;
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
