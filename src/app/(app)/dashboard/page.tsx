"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useDashboard } from "@/lib/queries";
import { PotHero } from "@/components/app/pot-hero";
import { DuesList } from "@/components/app/dues-list";
import { RecentFeed } from "@/components/app/recent-feed";
import { OverturnTable } from "@/components/app/overturn-table";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const member = useAuth().data?.member ?? null;

  useEffect(() => {
    if (member && member.role !== "tenant") router.replace("/hive");
  }, [member, router]);

  const { data, isPending } = useDashboard();

  if (member && member.role !== "tenant") return null;

  if (isPending || !data) {
    return (
      <main className="mx-auto max-w-2xl space-y-8 px-5 py-10">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-16 w-56" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-5 py-10">
      <PotHero pot={data.pot} count={data.potCount} />

      <Section
        title="Dues"
        action={
          <Link href="/bills" className="font-mono text-xs uppercase tracking-wider text-acid hover:underline">
            Bills →
          </Link>
        }
      >
        {data.dues.length ? (
          <DuesList dues={data.dues} />
        ) : (
          <EmptyState emoji="🎉" title="All square" note="Nobody owes the pot right now." />
        )}
      </Section>

      <Section
        title="Recent complaints"
        action={
          <Link href="/complaints" className="font-mono text-xs uppercase tracking-wider text-acid hover:underline">
            All →
          </Link>
        }
      >
        {data.recentFines.length ? (
          <RecentFeed items={data.recentFines} />
        ) : (
          <EmptyState emoji="😇" title="Suspiciously well-behaved" note="No complaints filed yet." />
        )}
      </Section>

      {data.overturn.length > 0 && (
        <Section title="🏆 Biggest false-reporters">
          <p className="mb-3 text-sm text-muted-foreground">Who files — and how often it gets overturned.</p>
          <OverturnTable rows={data.overturn} />
        </Section>
      )}
    </main>
  );
}
