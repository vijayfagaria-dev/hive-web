"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth, useBalances, useDashboard, useExpenses, useMyBalance, usePublicStats, useRentStatus } from "@/lib/queries";
import { GettingHereCard } from "@/components/app/getting-here-card";
import { DuesList } from "@/components/app/dues-list";
import { BillsList } from "@/components/app/bills-list";
import { RecentFeed } from "@/components/app/recent-feed";
import { OverturnTable } from "@/components/app/overturn-table";
import { EmptyState } from "@/components/app/empty-state";
import { ExpenseList } from "@/components/app/expense-list";
import { RentProgress } from "@/components/app/rent-progress";
import { RoommateLedger } from "@/components/app/roommate-ledger";
import { SpendingBreakdown } from "@/components/app/spending-breakdown";
import { StatTile } from "@/components/app/stat-tile";
import { CountUp } from "@/components/landing/count-up";
import { Skeleton } from "@/components/ui/skeleton";
import { thisMonth } from "@/lib/months";

const inr = (n: number) => n.toLocaleString("en-IN");

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
  const month = thisMonth();
  const monthName = new Date(`${month}-01T00:00`).toLocaleString("en-IN", { month: "long" });
  const me = useAuth().data?.member ?? null;
  const { data, isPending } = useDashboard();
  const bal = useMyBalance().data;
  const rent = useRentStatus(month).data;
  const ledger = useBalances().data?.balances;
  const expenses = useExpenses().data?.expenses;
  const gettingHere = usePublicStats().data?.gettingHere ?? null;
  const activeBills = data?.bills.filter((b) => b.status === "pending" || b.status === "disputed") ?? [];

  if (isPending || !data) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 px-5 py-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-2xl" />
      </main>
    );
  }

  const link = (href: string, label: string) => (
    <Link href={href} className="font-mono text-xs uppercase tracking-wider text-acid hover:underline">
      {label} →
    </Link>
  );

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-5 py-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">Your flat at a glance</p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Hey {me?.name} 👋</h1>
      </header>

      {gettingHere && <GettingHereCard here={gettingHere} />}

      {/* KPI row — the three numbers a tenant opens the app for */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {bal ? (
          <StatTile
            label={bal.net < 0 ? "You owe" : bal.net > 0 ? "You're owed" : "Your balance"}
            value={bal.net === 0 ? "All square" : `₹${inr(Math.abs(bal.net))}`}
            tone={bal.net < 0 ? "bad" : bal.net > 0 ? "good" : "default"}
            note={bal.finesOwed > 0 ? `incl. ₹${inr(bal.finesOwed)} in fines` : "expenses, fines & ledger"}
          />
        ) : (
          <Skeleton className="h-28 rounded-2xl" />
        )}
        {rent ? (
          <StatTile
            label={`Rent · ${monthName}`}
            value={rent.target ? `₹${inr(rent.collected)}` : "Not set"}
            tone={rent.complete ? "good" : "default"}
            note={rent.target ? (rent.complete ? "collected in full" : `of ₹${inr(rent.target)} · ₹${inr(rent.remaining)} to go`) : "set MONTHLY_RENT"}
          />
        ) : (
          <Skeleton className="h-28 rounded-2xl" />
        )}
        <StatTile
          label="In the jar"
          value={<CountUp value={data.pot} prefix="₹" />}
          note={`from ${data.potCount} confirmed ${data.potCount === 1 ? "fine" : "fines"}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Roommate ledger" action={link("/expenses", "Settle")}>
          {ledger ? <RoommateLedger rows={ledger} meId={me?.id} /> : <Skeleton className="h-32 w-full rounded-xl" />}
        </Section>

        {rent?.target ? (
          <Section title="Rent" action={link("/expenses", "Rent")}>
            <RentProgress data={rent} />
          </Section>
        ) : null}

        {/* Rent has its own card — leaving it out keeps the other categories readable. */}
        <Section title={`Shared spending · ${monthName}`}>
          {expenses ? (
            <SpendingBreakdown expenses={expenses.filter((e) => e.month === month && e.category !== "rent")} />
          ) : (
            <Skeleton className="h-32 w-full rounded-xl" />
          )}
        </Section>

        <Section title="Recent expenses" action={link("/expenses", "All")}>
          {!expenses ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : expenses.length ? (
            <ExpenseList expenses={expenses.slice(0, 4)} />
          ) : (
            <EmptyState emoji="🧾" title="No expenses yet" note="Log one from Money → I paid." />
          )}
        </Section>

        <Section title="Dues" action={link("/bills", "Bills")}>
          {data.dues.length ? (
            <DuesList dues={data.dues} />
          ) : (
            <EmptyState emoji="🎉" title="All square" note="Nobody owes the pot right now." />
          )}
        </Section>

        <Section title="Recent complaints" action={link("/complaints", "All")}>
          {data.recentFines.length ? (
            <RecentFeed items={data.recentFines} />
          ) : (
            <EmptyState emoji="😇" title="Suspiciously well-behaved" note="No complaints filed yet." />
          )}
        </Section>

        {activeBills.length > 0 && (
          <Section title="Bills awaiting confirmation" action={link("/bills", "Bills")}>
            <BillsList bills={activeBills} />
          </Section>
        )}

        {data.overturn.length > 0 && (
          <Section title="🏆 Biggest false-reporters">
            <p className="mb-3 text-sm text-muted-foreground">Who files — and how often it gets overturned.</p>
            <OverturnTable rows={data.overturn} />
          </Section>
        )}
      </div>
    </main>
  );
}
