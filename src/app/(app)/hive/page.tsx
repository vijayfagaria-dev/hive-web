"use client";

import Link from "next/link";
import { Camera, Landmark } from "lucide-react";
import { useMe } from "@/lib/queries";
import { GettingHereCard } from "@/components/app/getting-here-card";
import { RulesMenu } from "@/components/app/rules-menu";
import { ShameLeaderboard } from "@/components/app/shame-leaderboard";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HivePage() {
  const { data, isPending, isError } = useMe();

  if (isPending) {
    return (
      <main className="mx-auto max-w-2xl space-y-6 px-5 py-10">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </main>
    );
  }
  if (isError || !data) {
    return (
      <EmptyState
        emoji="🤷"
        title="Couldn't load your hive"
        note="Pull to refresh, or try again in a moment."
        className="min-h-[60svh]"
      />
    );
  }

  const { member, rulesByCategory, hallOfShame, gettingHere } = data;

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-5 py-10">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">Welcome home</p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Hey {member.name} 👋</h1>
      </header>

      {gettingHere && <GettingHereCard here={gettingHere} />}

      <Link
        href="/complaints/new"
        className="group flex items-center gap-4 rounded-2xl bg-primary p-5 text-primary-foreground glow-acid transition-transform hover:-translate-y-0.5"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-black/10">
          <Camera className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">Report a complaint</span>
          <span className="block text-sm opacity-80">Snap photo proof, then pick who & which rule.</span>
        </span>
        <span aria-hidden className="text-xl transition-transform group-hover:translate-x-1">→</span>
      </Link>

      <Link
        href="/governance"
        className="glass group flex items-center gap-4 rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-acid">
          <Landmark className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">Community Governance</span>
          <span className="block text-sm text-muted-foreground">Propose &amp; vote on house rules — make the Rule Book yours.</span>
        </span>
        <span aria-hidden className="text-xl text-muted-foreground transition-transform group-hover:translate-x-1">→</span>
      </Link>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">📜 House rules</h2>
          <Link href="/rules" className="font-mono text-xs uppercase tracking-wider text-acid hover:underline">
            Search all →
          </Link>
        </div>
        <div className="mt-4">
          <RulesMenu rulesByCategory={rulesByCategory} />
        </div>
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">🏆 Hall of Shame</h2>
          <Link href="/shame" className="font-mono text-xs uppercase tracking-wider text-acid hover:underline">
            Full board →
          </Link>
        </div>
        <div className="mt-2">
          {hallOfShame.length ? (
            <ShameLeaderboard rows={hallOfShame.slice(0, 5)} />
          ) : (
            <EmptyState emoji="😇" title="Spotless… for now" note="No fines on the board yet." />
          )}
        </div>
      </section>

      <p className="text-center">
        <Link href="/pay" className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}>
          💸 Pay into the pot
        </Link>
      </p>
    </main>
  );
}
