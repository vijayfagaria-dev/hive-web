"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth, useDashboard } from "@/lib/queries";
import { CountUp } from "@/components/landing/count-up";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

const STATUS: Record<string, string> = {
  pending: "bg-amber-400/15 text-amber-400",
  confirmed: "bg-acid/15 text-acid",
  upheld: "bg-acid/15 text-acid",
  disputed: "bg-destructive/20 text-destructive",
  void: "bg-white/10 text-muted-foreground",
};

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn("px-3 py-2 text-left font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground", className)}>
      {children}
    </th>
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
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-12">
        <div className="mx-auto h-28 w-72 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-52 animate-pulse rounded-2xl bg-white/5" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-14 px-6 py-14">
      <Reveal className="relative text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-acid/10 blur-[110px]"
        />
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">In the jar</p>
        <p className="mt-4 text-7xl font-bold leading-none tracking-tight tabular-nums text-glow sm:text-8xl">
          <CountUp value={data.pot} prefix="₹" />
        </p>
        <p className="mt-4 text-muted-foreground">
          from {data.potCount} confirmed {data.potCount === 1 ? "fine" : "fines"}
        </p>
      </Reveal>

      {data.dues.length > 0 && (
        <Reveal>
          <section className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Dues</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <Th>Who</Th>
                    <Th className="text-right">Fines</Th>
                    <Th className="text-right">Bills</Th>
                    <Th className="text-right">Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.dues.map((d) => (
                    <tr key={d.name} className="border-b border-white/5 last:border-0">
                      <td className="px-3 py-2.5">{d.name}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">₹{d.fines}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">₹{d.bills}</td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">₹{d.total.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </Reveal>
      )}

      <Reveal>
        <section className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Recent fines</h2>
          {data.recentFines.length === 0 ? (
            <p className="mt-4 text-muted-foreground">No fines yet. Suspiciously well-behaved. 😇</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <Th>Who</Th>
                    <Th>Rule</Th>
                    <Th className="text-right">Amount</Th>
                    <Th>Status</Th>
                    <Th>By</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentFines.map((f) => (
                    <tr key={f.id} className="border-b border-white/5 last:border-0">
                      <td className="px-3 py-2.5 whitespace-nowrap">{f.accused}</td>
                      <td className="px-3 py-2.5">{f.rule ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">₹{f.amount}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn("rounded-full px-2 py-0.5 font-mono text-[0.7rem] uppercase tracking-wide", STATUS[f.status] ?? "bg-white/10")}>
                          {f.status}
                        </span>
                        {f.paid && <span className="ml-1 text-xs text-muted-foreground">paid</span>}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{f.accuser}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Reveal>

      {data.overturn.length > 0 && (
        <Reveal>
          <section className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold">🏆 Hall of Shame</h2>
            <p className="mt-1 text-sm text-muted-foreground">Who reports — and how often it&apos;s overturned.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <Th>Member</Th>
                    <Th className="text-right">Filed</Th>
                    <Th className="text-right">Upheld</Th>
                    <Th className="text-right">Overturned</Th>
                    <Th className="text-right">Rate</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.overturn.map((o) => (
                    <tr key={o.name} className="border-b border-white/5 last:border-0">
                      <td className="px-3 py-2.5">{o.name}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{o.filed}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{o.upheld}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{o.overturned}</td>
                      <td className={cn("px-3 py-2.5 text-right tabular-nums", o.overturnRate > 40 && "font-semibold text-destructive")}>
                        {o.overturnRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </Reveal>
      )}
    </main>
  );
}
