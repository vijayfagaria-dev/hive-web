"use client";

import Link from "next/link";
import { useMe } from "@/lib/queries";
import { Reveal } from "@/components/reveal";
import { GettingHereCard } from "@/components/app/getting-here-card";
import { ReportForm } from "@/components/app/report-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HivePage() {
  const { data, isPending, isError } = useMe();

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-12">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-white/5" />
        <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-60 animate-pulse rounded-2xl bg-white/5" />
      </div>
    );
  }
  if (isError || !data) {
    return <p className="mx-auto max-w-3xl px-6 py-12 text-muted-foreground">Couldn&apos;t load your hive.</p>;
  }

  const { member, rulesByCategory, members, hallOfShame, gettingHere } = data;

  return (
    <main className="mx-auto max-w-3xl space-y-12 px-6 py-14">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">Welcome home</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Hey {member.name} 👋
        </h1>
      </Reveal>

      {gettingHere && (
        <Reveal>
          <GettingHereCard here={gettingHere} />
        </Reveal>
      )}

      <Reveal>
        <section className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">🚨 Report a fine</h2>
          <div className="mt-4">
            <ReportForm members={members} rulesByCategory={rulesByCategory} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Owe something?{" "}
            <Link href="/pay" className="font-medium text-acid underline-offset-4 hover:underline">
              Pay into the pot →
            </Link>
          </p>
        </section>
      </Reveal>

      <Reveal>
        <section>
          <h2 className="text-lg font-semibold">📜 House rules</h2>
          <div className="mt-4 space-y-6">
            {Object.entries(rulesByCategory).map(([cat, rules]) => (
              <div key={cat}>
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-acid">{cat}</h3>
                <ul className="mt-2 divide-y divide-white/8">
                  {rules.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-4 py-2.5">
                      <span>
                        {r.isFavorite && "⭐ "}
                        {r.text}
                      </span>
                      <span className="shrink-0 font-mono tabular-nums text-muted-foreground">₹{r.amount}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {hallOfShame.length > 0 && (
        <Reveal>
          <section className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold">🏆 Hall of Shame</h2>
            <ul className="mt-4 divide-y divide-white/8">
              {hallOfShame.map((s, i) => (
                <li key={s.name + i} className="flex items-center gap-4 py-2.5">
                  <span className="w-6 text-center font-mono text-sm tabular-nums text-muted-foreground">{i + 1}</span>
                  <span className="flex-1">{s.name}</span>
                  <span className="text-sm text-muted-foreground">{s.fines} fines</span>
                  <span className={cn("w-16 text-right font-semibold tabular-nums", i === 0 && "text-acid")}>
                    ₹{s.total.toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      )}

      <p className="text-center">
        <Link href="/pay" className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}>
          💸 Pay into the pot
        </Link>
      </p>
    </main>
  );
}
