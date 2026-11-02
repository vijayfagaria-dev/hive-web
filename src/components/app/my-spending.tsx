"use client";

import { useState } from "react";
import { useSpending } from "@/lib/queries";
import { monthLabel, thisMonth } from "@/lib/months";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { SpendingBreakdown, defaultSpendingMonth } from "@/components/app/spending-breakdown";

const inr = (n: number) => n.toLocaleString("en-IN");

/** What the flat cost *me*, month by month: my share of every shared expense (rent
 *  included), a running total across the months shown, and one month split by category. */
export function MySpending() {
  const { data, isPending } = useSpending();
  const [picked, setPicked] = useState<string | null>(null);
  if (isPending || !data) return <Skeleton className="h-64 w-full rounded-2xl" />;

  const months = data.months;
  const current = thisMonth();
  const withData = months.filter((m) => m.mine > 0);
  const sel = months.find((m) => m.month === (picked ?? defaultSpendingMonth(months)));
  if (!sel || !withData.length)
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nothing spent yet. Once you&apos;re part of an expense, your share shows up here.
      </p>
    );

  const sum = withData.reduce((s, m) => s + m.mine, 0);
  const max = Math.max(...months.map((m) => m.mine));

  return (
    <div className="space-y-4">
      {/* the aggregate */}
      <section className="glass rounded-2xl p-5">
        <p className="text-sm text-muted-foreground">
          You spent over the last {withData.length} {withData.length === 1 ? "month" : "months"}
        </p>
        <p className="mt-1 font-heading text-3xl font-bold tabular-nums tracking-tight">₹{inr(sum)}</p>
        <p className="mt-1 text-xs text-muted-foreground">about ₹{inr(Math.round(sum / withData.length))} a month</p>
      </section>

      {/* month by month — tap one for its breakdown */}
      <section className="glass rounded-2xl p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your share each month</p>
        <ul className="space-y-1">
          {months.map((m) => (
            <li key={m.month}>
              <button
                type="button"
                onClick={() => setPicked(m.month)}
                aria-pressed={m.month === sel.month}
                className={cn(
                  "grid w-full grid-cols-[6.5rem_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm",
                  m.month === sel.month ? "bg-primary/10" : "hover:bg-muted/50",
                )}
              >
                <span className="truncate">
                  {monthLabel(m.month)}
                  {m.month === current && <span className="text-muted-foreground"> · now</span>}
                </span>
                <span className="h-2.5">
                  {m.mine > 0 && (
                    <span className="block h-full rounded-r-[4px] bg-primary" style={{ width: `${(m.mine / max) * 100}%` }} />
                  )}
                </span>
                <span className="tabular-nums text-muted-foreground">₹{inr(m.mine)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* one month */}
      <section className="glass rounded-2xl p-5">
        <h2 className="text-lg font-semibold tracking-tight">{monthLabel(sel.month)}</h2>
        <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
          {[
            ["Your share", sel.mine],
            ["You paid", sel.paid],
            ["Whole flat", sel.total],
          ].map(([label, amt]) => (
            <div key={label} className="rounded-xl border border-border px-2 py-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-semibold tabular-nums">₹{inr(amt as number)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          <b className="text-foreground">Your share</b> is what this month cost you.{" "}
          <b className="text-foreground">You paid</b> is what you put down upfront — the difference is squared up in Settle.
        </p>
        <div className="mt-4">
          <SpendingBreakdown
            rows={sel.categories.map((c) => ({ category: c.category, amount: c.mine }))}
            empty="You weren't part of any expense this month."
          />
        </div>
      </section>
    </div>
  );
}
