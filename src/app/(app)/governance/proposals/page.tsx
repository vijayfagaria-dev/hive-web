"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useProposals, type ProposalSummary } from "@/lib/governance";
import { useGovMe } from "@/lib/gov-user";
import { GovHeader } from "@/components/governance/gov-header";
import { ProposalCard } from "@/components/governance/proposal-card";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Tab = "active" | "passed" | "rejected" | "mine";

const TABS = [
  ["active", "Active"],
  ["passed", "Passed"],
  ["rejected", "Rejected"],
  ["mine", "Mine"],
] as const satisfies readonly (readonly [Tab, string])[];

const EMPTY: Record<Tab, { emoji: string; title: string; note: string; cta?: boolean }> = {
  active: {
    emoji: "🌱",
    title: "No active proposals",
    note: "Be the first to improve the community.",
    cta: true,
  },
  passed: {
    emoji: "📜",
    title: "Nothing enshrined yet",
    note: "Passed rules will live here.",
  },
  rejected: {
    emoji: "🗳️",
    title: "Clean slate",
    note: "Rejected and cancelled proposals are archived here.",
  },
  mine: {
    emoji: "✍️",
    title: "You haven't proposed anything",
    note: "Got a house-rule idea? Start a proposal.",
    cta: true,
  },
};

function ProposeButton() {
  return (
    <Link
      href="/governance/propose"
      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-acid transition active:scale-95"
    >
      Propose a rule
    </Link>
  );
}

function matchesTab(p: ProposalSummary, tab: Tab, meId: number | undefined): boolean {
  switch (tab) {
    case "active":
      return p.phase === "voting" || p.phase === "review";
    case "passed":
      return p.phase === "passed";
    case "rejected":
      return p.phase === "rejected" || p.phase === "cancelled";
    case "mine":
      return meId != null && p.proposer?.id === meId;
  }
}

export default function ProposalsPage() {
  const me = useGovMe();
  const [tab, setTab] = useState<Tab>("active");
  const reduce = useReducedMotion();

  const { data, isPending, isError } = useProposals();

  const counts = useMemo<Record<Tab, number>>(() => {
    const all = data?.proposals ?? [];
    return {
      active: all.filter((p) => matchesTab(p, "active", me?.id)).length,
      passed: all.filter((p) => matchesTab(p, "passed", me?.id)).length,
      rejected: all.filter((p) => matchesTab(p, "rejected", me?.id)).length,
      mine: all.filter((p) => matchesTab(p, "mine", me?.id)).length,
    };
  }, [data, me?.id]);

  const proposals = useMemo(
    () => (data?.proposals ?? []).filter((p) => matchesTab(p, tab, me?.id)),
    [data, tab, me?.id],
  );

  function onTabKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = (index + dir + TABS.length) % TABS.length;
    const entry = TABS[next];
    if (!entry) return;
    setTab(entry[0]);
    document.getElementById(`gov-tab-${entry[0]}`)?.focus();
  }

  const empty = EMPTY[tab];

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <GovHeader title="Proposals" subtitle="Propose, debate, and vote the Rule Book into shape." />

      {/* segmented tab bar */}
      <div
        role="tablist"
        aria-label="Proposal filters"
        className="grid grid-cols-4 gap-1 rounded-full border border-border bg-card p-1"
      >
        {TABS.map(([key, label], i) => {
          const selected = tab === key;
          return (
            <button
              key={key}
              id={`gov-tab-${key}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="gov-tabpanel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(key)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
              className={cn(
                "inline-flex items-center justify-center gap-1 rounded-full px-2 py-1.5 text-[0.82rem] font-medium transition-colors",
                selected ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              <span
                className={cn(
                  "min-w-4 rounded-full px-1 text-center font-mono text-[0.6rem] leading-4 tabular-nums",
                  selected ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
                )}
              >
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      <div id="gov-tabpanel" role="tabpanel" aria-labelledby={`gov-tab-${tab}`} className="mt-5">
        {isPending ? (
          <ul className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-32 w-full rounded-2xl" />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <EmptyState
            emoji="🛑"
            title="Couldn't load proposals"
            note="The chamber is unreachable right now — try again in a moment."
            className="min-h-[50svh]"
          />
        ) : proposals.length ? (
          <ul className="space-y-3">
            {proposals.map((p, i) => (
              <motion.li
                key={p.id}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduce ? { duration: 0 } : { duration: 0.3, delay: Math.min(i * 0.05, 0.4), ease: "easeOut" }
                }
              >
                <ProposalCard proposal={p} me={me} />
              </motion.li>
            ))}
          </ul>
        ) : (
          <EmptyState
            emoji={empty.emoji}
            title={empty.title}
            note={empty.note}
            action={empty.cta ? <ProposeButton /> : undefined}
            className="min-h-[50svh]"
          />
        )}
      </div>
    </main>
  );
}
