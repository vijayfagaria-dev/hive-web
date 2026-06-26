"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  PHASE_META,
  categoryEmoji,
  useProposals,
  yesPct,
  type ProposalPhase,
  type ProposalSummary,
} from "@/lib/governance";
import { Avatar } from "@/components/app/avatar";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "./status-chip";
import { VoteRing } from "./vote-ring";
import { cn } from "@/lib/utils";

const MEDALS = ["🥇", "🥈", "🥉"] as const;

const ACCENT = {
  sky: "text-sky-700",
  lime: "text-acid",
  amber: "text-amber-700",
  ink: "text-foreground",
} as const;

/* ── phases shown in the breakdown bar ── */
const PHASE_ORDER: ProposalPhase[] = ["voting", "review", "passed", "rejected", "draft", "cancelled"];
const PHASE_BAR_CLASS: Record<ProposalPhase, string> = {
  voting: "bg-primary",
  review: "bg-amber-400",
  passed: "bg-sky-400",
  rejected: "bg-destructive",
  draft: "bg-muted-foreground/40",
  cancelled: "bg-muted-foreground/25",
};

/* ── mount-staggered card wrapper (respects reduced motion) ── */
function Reveal({ i = 0, className, children }: { i?: number; className?: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ── relative time, formatted on mount (no Date.now during render) ── */
function RelativeTime({ ts }: { ts: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const diff = Date.now() - new Date(ts).getTime();
    const s = Math.max(0, Math.floor(diff / 1000));
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const dy = Math.floor(h / 24);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- format relative time on mount (no Date.now during render)
    setLabel(dy > 0 ? `${dy}d ago` : h > 0 ? `${h}h ago` : m > 0 ? `${m}m ago` : "just now");
  }, [ts]);
  return (
    <span suppressHydrationWarning className="shrink-0 font-mono text-[0.65rem] tabular-nums text-muted-foreground">
      {label}
    </span>
  );
}

/* ── stat card ── */
function StatCard({
  label,
  value,
  accent,
  pulse = false,
}: {
  label: string;
  value: ReactNode;
  accent: keyof typeof ACCENT;
  pulse?: boolean;
}) {
  return (
    <div className="glass flex flex-col gap-1.5 rounded-2xl p-4 transition-shadow hover:shadow-md">
      <p className="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
        {pulse && (
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-70 motion-reduce:hidden" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
        )}
        {label}
      </p>
      <div className={cn("font-heading text-3xl font-bold tabular-nums tracking-tight", ACCENT[accent])}>{value}</div>
    </div>
  );
}

/* ── section shell ── */
function Panel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="glass rounded-2xl p-5 transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-acid">{title}</h2>
        {hint && <span className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

/* ── mini proposal card (most supported / most controversial) ── */
function ProposalMini({
  proposal,
  tone,
}: {
  proposal: ProposalSummary;
  tone: "live" | "neutral";
}) {
  const pct = yesPct(proposal.tally);
  return (
    <Link
      href={`/governance/proposals/${proposal.id}`}
      className="group flex items-start gap-4 rounded-xl border border-border/70 bg-card/50 p-3 transition-colors hover:border-acid"
    >
      <VoteRing pct={pct} tone={tone === "live" ? "live" : "neutral"} size={64} stroke={6} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">
          <span aria-hidden>{categoryEmoji(proposal.proposedCategory)}</span>
          <span className="truncate">{proposal.proposedCategory ?? "general"}</span>
        </div>
        <h3 className="mt-0.5 text-pretty font-heading text-sm font-semibold leading-snug tracking-tight group-hover:text-acid">
          {proposal.title}
        </h3>
        <div className="mt-2">
          <StatusChip phase={proposal.phase} />
        </div>
      </div>
    </Link>
  );
}

/* ── animated phase-breakdown bar ── */
function PhaseBreakdown({ counts, total }: { counts: Record<ProposalPhase, number>; total: number }) {
  const reduce = useReducedMotion();
  const segments = PHASE_ORDER.filter((p) => counts[p] > 0);
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label="Proposals by phase">
        {segments.map((p, i) => {
          const pct = total > 0 ? (counts[p] / total) * 100 : 0;
          return (
            <motion.div
              key={p}
              className={cn("h-full", PHASE_BAR_CLASS[p])}
              style={{ width: `${pct}%` }}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.06, ease: "easeOut" }}
              aria-label={`${PHASE_META[p].label}: ${counts[p]}`}
            />
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((p) => (
          <li key={p} className="flex items-center gap-1.5 text-xs">
            <span className={cn("size-2 rounded-full", PHASE_BAR_CLASS[p])} aria-hidden />
            <span className="text-muted-foreground">{PHASE_META[p].label}</span>
            <span className="font-mono tabular-nums">{counts[p]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GovDashboard() {
  const { data, isPending, isError } = useProposals();

  if (isPending) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        emoji="🛑"
        title="Couldn't load the chamber"
        note="The democracy is taking a breather — try again in a moment."
        className="min-h-[50svh]"
      />
    );
  }

  const proposals = data.proposals;

  if (proposals.length === 0) {
    return (
      <EmptyState
        emoji="🏛️"
        title="The chamber is quiet"
        note="No proposals yet — start the first one."
        action={
          <Link
            href="/governance/propose"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-acid"
          >
            Propose a rule
          </Link>
        }
        className="min-h-[50svh]"
      />
    );
  }

  /* ── derive everything from the real list ── */
  const phaseCounts: Record<ProposalPhase, number> = {
    draft: 0,
    review: 0,
    voting: 0,
    passed: 0,
    rejected: 0,
    cancelled: 0,
  };
  for (const p of proposals) phaseCounts[p.phase] += 1;

  const voting = proposals.filter((p) => p.phase === "voting");
  const decidedVoting = voting.filter((p) => p.tally.yes + p.tally.no > 0);

  // Most Supported — max yesPct among live, decided proposals.
  let mostSupported: ProposalSummary | null = null;
  let mostSupportedPct = -1;
  for (const p of decidedVoting) {
    const pct = yesPct(p.tally);
    if (pct > mostSupportedPct) {
      mostSupportedPct = pct;
      mostSupported = p;
    }
  }

  // Most Controversial — yesPct closest to 50.
  let mostControversial: ProposalSummary | null = null;
  let bestDist = Infinity;
  for (const p of decidedVoting) {
    const dist = Math.abs(yesPct(p.tally) - 50);
    if (dist < bestDist) {
      bestDist = dist;
      mostControversial = p;
    }
  }

  // Top proposers — count by proposer name.
  const proposerCounts = new Map<string, number>();
  for (const p of proposals) {
    const name = p.proposer?.name;
    if (name) proposerCounts.set(name, (proposerCounts.get(name) ?? 0) + 1);
  }
  const topProposers = Array.from(proposerCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Recent — latest 5 by createdAt.
  const recent = [...proposals]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* 1 ── stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Reveal i={0}>
          <StatCard label="Passed" value={phaseCounts.passed} accent="sky" />
        </Reveal>
        <Reveal i={1}>
          <StatCard
            label="Active Voting"
            value={phaseCounts.voting}
            accent="lime"
            pulse={phaseCounts.voting > 0}
          />
        </Reveal>
        <Reveal i={2}>
          <StatCard label="In Review" value={phaseCounts.review} accent="amber" />
        </Reveal>
        <Reveal i={3}>
          <StatCard label="Total" value={proposals.length} accent="ink" />
        </Reveal>
      </div>

      {/* 2 & 3 ── most supported / most controversial */}
      <div className="grid gap-3 md:grid-cols-2">
        <Reveal i={4}>
          <Panel title="Most Supported" hint="🔥 Leading">
            {mostSupported ? (
              <ProposalMini proposal={mostSupported} tone="live" />
            ) : (
              <p className="text-sm text-muted-foreground">No active proposals to rally behind yet.</p>
            )}
          </Panel>
        </Reveal>
        <Reveal i={5}>
          <Panel title="Most Controversial" hint="⚖️ Too close to call">
            {mostControversial ? (
              <>
                <ProposalMini proposal={mostControversial} tone="neutral" />
                <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  Split {Math.round(yesPct(mostControversial.tally))}% /{" "}
                  {100 - Math.round(yesPct(mostControversial.tally))}%
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing&apos;s dividing the flat right now.</p>
            )}
          </Panel>
        </Reveal>
      </div>

      {/* 4 & 5 ── top proposers + phase breakdown */}
      <div className="grid gap-3 md:grid-cols-2">
        <Reveal i={6}>
          <Panel title="Top Proposers">
            {topProposers.length ? (
              <ol className="space-y-2.5">
                {topProposers.map((c, i) => (
                  <li key={c.name} className="flex items-center gap-3">
                    <span className="w-5 shrink-0 text-center text-sm" aria-hidden>
                      {MEDALS[i] ?? <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>}
                    </span>
                    <Avatar name={c.name} className="size-8 text-xs" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.name}</span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {c.count} {c.count === 1 ? "proposal" : "proposals"}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No proposers yet.</p>
            )}
          </Panel>
        </Reveal>

        <Reveal i={7}>
          <Panel title="By Phase" hint={`${proposals.length} total`}>
            <PhaseBreakdown counts={phaseCounts} total={proposals.length} />
          </Panel>
        </Reveal>
      </div>

      {/* 6 ── recent proposals */}
      <Reveal i={8}>
        <Panel title="Recent Proposals">
          <ul className="space-y-3">
            {recent.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/governance/proposals/${p.id}`}
                  className="group flex items-start gap-3 rounded-xl px-1 py-1 transition-colors hover:bg-muted/50"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-sm" aria-hidden>
                    {categoryEmoji(p.proposedCategory)}
                  </span>
                  <div className="min-w-0 flex-1 leading-snug">
                    <p className="truncate text-sm font-medium group-hover:text-acid">{p.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {p.proposer?.name ?? "Someone"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusChip phase={p.phase} />
                    <RelativeTime ts={p.createdAt} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </Reveal>

      {/* 7 ── rule book CTA */}
      <Reveal i={9}>
        <Link
          href="/governance/rulebook"
          className="glass group flex items-center justify-between gap-3 rounded-2xl p-5 transition-shadow hover:shadow-md"
        >
          <div>
            <p className="font-heading text-base font-semibold tracking-tight group-hover:text-acid">
              📖 Browse the Rule Book
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Every house rule the flat has voted into law.
            </p>
          </div>
          <span
            aria-hidden
            className="font-mono text-lg text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-acid"
          >
            →
          </span>
        </Link>
      </Reveal>
    </div>
  );
}
