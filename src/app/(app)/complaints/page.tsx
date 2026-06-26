"use client";

import { useState } from "react";
import Link from "next/link";
import { PHASE_OF } from "@/lib/api";
import { useAuth, useDashboard } from "@/lib/queries";
import { RecentFeed } from "@/components/app/recent-feed";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const FILTERS = [
  ["all", "All"],
  ["me", "About me"],
  ["by", "By me"],
  ["voting", "Voting now"],
] as const;
type FilterKey = (typeof FILTERS)[number][0];

export default function FeedPage() {
  const member = useAuth().data?.member ?? null;
  const isTenant = member?.role === "tenant";
  const { data, isPending, isError } = useDashboard(); // the only complaint list the API exposes
  const [filter, setFilter] = useState<FilterKey>("all");

  // Guests can't read /dashboard — but they still get notified about anything involving them.
  if (member && !isTenant) {
    return (
      <EmptyState
        emoji="⚖️"
        title="The feed is a tenant thing"
        note="Guests don't see the whole flat's feed — but you'll be pinged about anything involving you."
        action={
          <Link href="/notifications" className="rounded-full border border-border px-4 py-2 text-sm">
            Notifications →
          </Link>
        }
        className="min-h-[60svh]"
      />
    );
  }

  if (isPending) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 px-5 py-8">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-64 rounded-full" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </main>
    );
  }
  if (isError || !data) {
    return <EmptyState emoji="🤷" title="Couldn't load the feed" className="min-h-[60svh]" />;
  }

  const items = data.recentFines.filter((f) => {
    if (filter === "me") return member ? f.accused === member.name : false;
    if (filter === "by") return member ? f.accuser === member.name : false;
    if (filter === "voting") return PHASE_OF[f.status] === "voting";
    return true;
  });

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="font-heading text-3xl font-bold tracking-tight">⚖️ The Feed</h1>
      <p className="mt-1 text-sm text-muted-foreground">Recent complaints across the flat.</p>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              filter === k ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {items.length ? (
          <RecentFeed items={items} />
        ) : (
          <EmptyState emoji="😇" title="Nothing here" note="No complaints match this filter." />
        )}
      </div>
    </main>
  );
}
