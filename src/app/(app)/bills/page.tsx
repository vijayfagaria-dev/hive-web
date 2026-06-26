"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAuth, useDashboard, useMe } from "@/lib/queries";
import { DuesList } from "@/components/app/dues-list";
import { BillCreateForm } from "@/components/app/bill-create-form";
import { Sheet } from "@/components/app/sheet";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function BillsPage() {
  const router = useRouter();
  const member = useAuth().data?.member ?? null;

  useEffect(() => {
    if (member && member.role !== "tenant") router.replace("/hive");
  }, [member, router]);

  const { data, isPending } = useDashboard();
  const me = useMe();
  const [open, setOpen] = useState(false);

  if (member && member.role !== "tenant") return null;

  if (isPending || !data) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 px-5 py-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-12 w-full rounded-full" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-5 py-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">🧾 Bills &amp; dues</h1>
        <p className="mt-1 text-sm text-muted-foreground">Rent, house help, electricity, water — split point-in-time.</p>
      </header>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground glow-acid"
      >
        <Plus className="size-5" /> Add a bill
      </button>

      <section className="glass rounded-2xl p-5">
        <h2 className="text-lg font-semibold tracking-tight">Who owes what</h2>
        <div className="mt-3">
          {data.dues.length ? (
            <DuesList dues={data.dues} />
          ) : (
            <EmptyState emoji="🎉" title="All square" note="No outstanding dues right now." />
          )}
        </div>
      </section>

      <p className="text-center font-mono text-xs text-muted-foreground">
        The API doesn&apos;t list bills yet — dues above reflect every split.
      </p>

      <Sheet open={open} onClose={() => setOpen(false)} title="Add a bill">
        <BillCreateForm members={me.data?.members ?? []} onDone={() => setOpen(false)} />
      </Sheet>
    </main>
  );
}
