"use client";

import { usePublicStats } from "@/lib/queries";

/** The login's left panel — the live pot as a glowing headline (sample numbers
 *  until the backend has real activity). */
export function AuthAside() {
  const { data } = usePublicStats();
  const pot = data?.pot || 4250;
  const fines = data?.potCount || 37;
  const residents = data?.hallOfShame.length || 6;

  return (
    <aside className="relative hidden flex-col justify-center overflow-hidden border-r border-white/10 p-12 lg:flex xl:p-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/2 h-[44rem] w-[44rem] -translate-y-1/2 rounded-full bg-acid/12 blur-[160px]"
      />
      <p className="font-mono text-xs uppercase tracking-[0.4em] text-acid">After hours</p>
      <p className="mt-10 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Tonight&apos;s damage
      </p>
      <p className="mt-3 text-7xl font-bold leading-none tracking-tight tabular-nums text-glow xl:text-8xl">
        ₹{pot.toLocaleString("en-IN")}
      </p>
      <p className="mt-8 max-w-sm text-lg leading-relaxed text-muted-foreground">
        The flat never sleeps. Neither does the ledger. Log in and face the music.
      </p>
      <div className="mt-10 flex gap-8 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span>
          <span className="text-foreground">{fines}</span> fines
        </span>
        <span>
          <span className="text-foreground">{residents}</span> residents
        </span>
        <span>
          <span className="text-acid">1</span> jar
        </span>
      </div>
    </aside>
  );
}
