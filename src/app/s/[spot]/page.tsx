"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSpot } from "@/lib/queries";
import { ReportForm } from "@/components/app/report-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SpotPage() {
  const params = useParams<{ spot: string }>();
  const spot = String(params.spot ?? "");
  const { data, isPending, isError } = useSpot(spot);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="font-mono text-sm font-semibold uppercase tracking-[0.2em]">
          Hive
        </Link>
        {data?.member ? (
          <Link href="/hive" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Home
          </Link>
        ) : (
          <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Log in
          </Link>
        )}
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        {isPending ? (
          <div className="space-y-4">
            <div className="h-12 w-48 animate-pulse rounded-lg bg-white/5" />
            <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
          </div>
        ) : isError || !data ? (
          <div className="py-20 text-center">
            <p className="text-6xl">🤷</p>
            <h1 className="mt-4 text-2xl font-bold">No such spot.</h1>
            <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-6 rounded-full")}>
              Back to Hive
            </Link>
          </div>
        ) : (
          <>
            <header className="relative text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-0 -z-10 h-48 w-72 -translate-x-1/2 rounded-full bg-acid/10 blur-[100px]"
              />
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {data.config.emoji} {data.config.title}
              </h1>
              <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <span className="text-acid">₹{data.pot.toLocaleString("en-IN")}</span> in the pot ·{" "}
                {data.potCount} confirmed
              </p>
            </header>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {data.member ? (
                <>
                  <Link href="/pay" className={cn(buttonVariants({ size: "sm" }), "rounded-full font-semibold")}>
                    💸 Pay
                  </Link>
                  {data.isTenant && (
                    <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}>
                      📊 Dashboard
                    </Link>
                  )}
                </>
              ) : (
                <Link href="/login" className={cn(buttonVariants({ size: "sm" }), "rounded-full font-semibold")}>
                  Log in to report or pay
                </Link>
              )}
            </div>

            {data.member && data.rules.length > 0 && (
              <section className="glass mt-10 rounded-2xl p-6">
                <h2 className="text-lg font-semibold">🚨 Report a fine here</h2>
                <div className="mt-4">
                  <ReportForm
                    members={data.members}
                    rulesByCategory={{ [data.config.category ?? "rules"]: data.rules }}
                  />
                </div>
              </section>
            )}

            {data.rules.length > 0 && (
              <section className="mt-10">
                <h2 className="text-lg font-semibold">📜 {data.config.title} rules</h2>
                <ul className="mt-4 divide-y divide-white/8">
                  {data.rules.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-4 py-2.5">
                      <span>
                        {r.isFavorite && "⭐ "}
                        {r.text}
                      </span>
                      <span className="shrink-0 font-mono tabular-nums text-muted-foreground">₹{r.amount}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.config.shame && data.hallOfShame.length > 0 && (
              <section className="glass mt-10 rounded-2xl p-6">
                <h2 className="text-lg font-semibold">🏆 Hall of Shame</h2>
                <ul className="mt-4 divide-y divide-white/8">
                  {data.hallOfShame.map((s, i) => (
                    <li key={s.name + i} className="flex items-center gap-4 py-2.5">
                      <span className="w-6 text-center font-mono text-sm tabular-nums text-muted-foreground">{i + 1}</span>
                      <span className="flex-1">{s.name}</span>
                      <span className={cn("w-16 text-right font-semibold tabular-nums", i === 0 && "text-acid")}>
                        ₹{s.total.toLocaleString("en-IN")}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
