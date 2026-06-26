"use client";

import { useMe } from "@/lib/queries";
import { ShameLeaderboard } from "@/components/app/shame-leaderboard";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShamePage() {
  const { data, isPending, isError } = useMe();

  if (isPending) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 px-5 py-10">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </main>
    );
  }
  if (isError || !data) {
    return <EmptyState emoji="🤷" title="Couldn't load the board" className="min-h-[60svh]" />;
  }

  const rows = data.hallOfShame;

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="font-heading text-3xl font-bold tracking-tight">🏆 Hall of Shame</h1>
      <p className="mt-1 text-muted-foreground">Who&apos;s funding the jar.</p>
      <div className="mt-6 glass rounded-2xl px-3 py-2">
        {rows.length ? (
          <ShameLeaderboard rows={rows} />
        ) : (
          <EmptyState emoji="😇" title="Spotless… for now" note="Nobody's been fined yet. Give it time." />
        )}
      </div>
    </main>
  );
}
