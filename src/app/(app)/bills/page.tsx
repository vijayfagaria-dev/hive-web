"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAuth, useDashboard } from "@/lib/queries";
import { DuesList } from "@/components/app/dues-list";
import { BillsList } from "@/components/app/bills-list";
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
        <p className="mt-1 text-sm text-muted-foreground">
          Paid a shared bill? Declare it — the flat has time to dispute, then it auto-confirms.
        </p>
      </header>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground glow-acid"
      >
        <Plus className="size-5" /> I paid a bill
      </button>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Recent bills</h2>
        <div className="mt-3">
          {data.bills.length ? (
            <BillsList bills={data.bills} />
          ) : (
            <EmptyState emoji="🧾" title="No bills yet" note="Declare one when you've paid a shared bill." />
          )}
        </div>
      </section>

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

      <Sheet open={open} onClose={() => setOpen(false)} title="I paid a bill">
        <BillCreateForm onDone={() => setOpen(false)} />
      </Sheet>
    </main>
  );
}
