"use client";

import { useRouter } from "next/navigation";
import { useMe } from "@/lib/queries";
import { RulesMenu } from "@/components/app/rules-menu";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function RulesPage() {
  const router = useRouter();
  const { data, isPending, isError } = useMe();

  if (isPending) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 px-5 py-10">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </main>
    );
  }
  if (isError || !data) {
    return <EmptyState emoji="🤷" title="Couldn't load the rules" className="min-h-[60svh]" />;
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="font-heading text-3xl font-bold tracking-tight">📜 House rules</h1>
      <p className="mt-1 text-muted-foreground">Tap a rule to file a complaint about it.</p>
      <div className="mt-6">
        <RulesMenu
          rulesByCategory={data.rulesByCategory}
          searchable
          onPick={(r) => router.push(`/complaints/new?ruleId=${r.id}`)}
        />
      </div>
    </main>
  );
}
