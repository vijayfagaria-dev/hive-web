"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSpot } from "@/lib/queries";
import { ReportForm } from "@/components/app/report-form";
import { RulesMenu } from "@/components/app/rules-menu";
import { ShameLeaderboard } from "@/components/app/shame-leaderboard";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inr = (n: number) => n.toLocaleString("en-IN");

export default function SpotPage() {
  const params = useParams<{ spot: string }>();
  const spot = String(params.spot ?? "");
  const { data, isPending, isError } = useSpot(spot);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="font-mono text-sm font-semibold uppercase tracking-[0.2em]">
          hive
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

      <main className="mx-auto w-full max-w-xl flex-1 px-5 py-4">
        {isPending ? (
          <div className="space-y-4">
            <Skeleton className="mx-auto h-12 w-48" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : isError || !data ? (
          <EmptyState
            emoji="🤷"
            title="No such spot"
            note="That sticker doesn't map to a known spot."
            action={
              <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}>
                Back to Hive
              </Link>
            }
            className="min-h-[60svh]"
          />
        ) : (
          <>
            <div className="relative text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[90px]"
              />
              <div className="text-5xl" aria-hidden>
                {data.config.emoji}
              </div>
              <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{data.config.title}</h1>
              <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <span className="text-acid">₹{inr(data.pot)}</span> in the pot · {data.potCount} confirmed
              </p>
            </div>

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
              <section className="glass mt-8 rounded-2xl p-5">
                <h2 className="text-lg font-semibold">🚨 Report a fine here</h2>
                <div className="mt-4">
                  <ReportForm members={data.members} rulesByCategory={{ [data.config.category ?? "rules"]: data.rules }} />
                </div>
              </section>
            )}

            {data.rules.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-semibold">📜 {data.config.title} rules</h2>
                <div className="mt-3">
                  <RulesMenu rulesByCategory={{ [data.config.category ?? "Rules"]: data.rules }} />
                </div>
              </section>
            )}

            {data.config.shame && data.hallOfShame.length > 0 && (
              <section className="glass mt-8 rounded-2xl px-3 py-2">
                <h2 className="px-2 py-2 text-lg font-semibold">🏆 Hall of Shame</h2>
                <ShameLeaderboard rows={data.hallOfShame} />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
