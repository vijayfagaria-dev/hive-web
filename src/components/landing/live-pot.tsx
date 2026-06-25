"use client";

import { usePublicStats } from "@/lib/queries";
import { CountUp } from "./count-up";

export function LivePot() {
  const { data } = usePublicStats();
  // Graceful fallback so the landing is gorgeous even if the API is asleep.
  const pot = data?.pot ?? 4250;
  const count = data?.potCount ?? 37;

  return (
    <div className="relative text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-acid/10 blur-[120px]"
      />
      <p className="inline-flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-acid opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-acid" />
        </span>
        In the jar right now
      </p>
      <p className="mt-6 text-7xl font-bold leading-none tracking-tight tabular-nums text-glow sm:text-8xl md:text-9xl">
        <CountUp value={pot} prefix="₹" />
      </p>
      <p className="mt-6 text-lg text-muted-foreground">
        from <CountUp value={count} className="font-semibold text-foreground" /> confirmed fines — and
        counting.
      </p>
    </div>
  );
}
