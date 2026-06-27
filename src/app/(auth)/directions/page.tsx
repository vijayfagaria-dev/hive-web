"use client";

import Link from "next/link";
import { usePublicStats } from "@/lib/queries";
import { GettingHereCard } from "@/components/app/getting-here-card";

export default function DirectionsPage() {
  const { data, isPending } = usePublicStats();
  const here = data?.gettingHere ?? null;

  return (
    <div className="flex flex-col">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">Coming over?</p>
      <h1 className="mt-4 text-5xl font-bold leading-[0.95] tracking-tight">
        Getting
        <br />
        here.
      </h1>
      <p className="mt-4 text-muted-foreground">Directions to the flat — no account needed.</p>

      <div className="mt-9">
        {isPending ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : here ? (
          <GettingHereCard here={here} />
        ) : (
          <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            The flat hasn&apos;t shared its location yet.
          </p>
        )}

        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-foreground underline underline-offset-4"
        >
          ← Back to log in
        </Link>
      </div>
    </div>
  );
}
