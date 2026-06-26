"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Star } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  categoryEmoji,
  useRulebook,
  useRollbackRule,
  useRuleVersions,
  type RuleBookRule,
  type RuleVersion,
} from "@/lib/governance";
import { useGovMe } from "@/lib/gov-user";
import { ApiError } from "@/lib/api";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Renders a relative time on the client only, to avoid Date.now()/new Date() in render. */
function RelTime({ ts }: { ts: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const then = new Date(ts).getTime();
    const diff = Date.now() - then;
    const mins = Math.round(diff / 60000);
    let next: string;
    if (mins < 1) next = "just now";
    else if (mins < 60) next = `${mins}m ago`;
    else if (mins < 1440) next = `${Math.round(mins / 60)}h ago`;
    else next = `${Math.round(mins / 1440)}d ago`;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- relative time computed on mount to avoid Date.now() during render
    setLabel(next);
  }, [ts]);
  return (
    <time dateTime={ts} className="font-mono text-[0.65rem] tabular-nums text-muted-foreground">
      {label || " "}
    </time>
  );
}

function AmountPill({ amount }: { amount: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-foreground">
      ₹{amount}
    </span>
  );
}

function SeverityBadge({ tier }: { tier: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">
      {tier}
    </span>
  );
}

/** Expanded version history for one rule. Only queried when the rule is open. */
function VersionHistory({ rule, isAdmin }: { rule: RuleBookRule; isAdmin: boolean }) {
  const { data, isPending, isError, refetch } = useRuleVersions(rule.id, true);
  const rollback = useRollbackRule(rule.id);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isPending) {
    return (
      <div className="space-y-2 pt-1">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <span>Couldn&apos;t load the history.</span>
        <button type="button" onClick={() => refetch()} className="font-medium underline">
          Retry
        </button>
      </div>
    );
  }

  // Newest-first.
  const versions = [...data.versions].sort((a, b) => b.versionNumber - a.versionNumber);
  if (versions.length === 0) {
    return <p className="py-2 text-sm text-muted-foreground">No version history yet.</p>;
  }

  function doRollback(version: RuleVersion) {
    if (!window.confirm(`Roll back to v${version.versionNumber}? This makes it the active rule.`)) return;
    setActionError(null);
    rollback.mutate(version.id, {
      onError: (e) => setActionError(e instanceof ApiError ? e.message : "Couldn't roll back."),
    });
  }

  return (
    <div className="space-y-2 pt-1">
      {actionError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{actionError}</p>
      )}
      <ol className="space-y-2">
        {versions.map((v) => (
          <li
            key={v.id}
            className={cn(
              "rounded-xl border px-3 py-2.5",
              v.active ? "border-primary/40 bg-primary/5" : "border-border bg-card",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold tabular-nums">v{v.versionNumber}</span>
              <AmountPill amount={v.amount} />
              {v.active && (
                <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-primary-foreground">
                  Active
                </span>
              )}
              <span className="ml-auto">
                <RelTime ts={v.createdAt} />
              </span>
            </div>
            <p className="mt-1.5 text-pretty text-sm leading-snug">{v.text}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {v.proposalId != null && (
                <Link
                  href={`/governance/proposals/${v.proposalId}`}
                  className="font-mono text-[0.65rem] uppercase tracking-wider text-acid hover:underline"
                >
                  from proposal #{v.proposalId}
                </Link>
              )}
              {isAdmin && !v.active && (
                <button
                  type="button"
                  disabled={rollback.isPending}
                  onClick={() => doRollback(v)}
                  className="ml-auto rounded-full border border-border px-3 py-1 text-xs font-semibold transition-colors hover:border-foreground disabled:opacity-50"
                >
                  {rollback.isPending ? "Rolling back…" : "Rollback to this"}
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RuleCard({ rule, isAdmin }: { rule: RuleBookRule; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  return (
    <article className="glass overflow-hidden rounded-2xl transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Collapse version history" : "Expand version history"}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-pretty font-heading text-base font-semibold leading-snug tracking-tight">
            {rule.text}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <AmountPill amount={rule.amount} />
            {rule.severityTier && <SeverityBadge tier={rule.severityTier} />}
            <span className="font-mono text-[0.65rem] text-muted-foreground">used {rule.useCount}×</span>
            {rule.isFavorite && (
              <span className="inline-flex items-center gap-0.5 text-acid" title="Favorite">
                <Star className="size-3.5 fill-current" aria-hidden />
                <span className="sr-only">Favorite</span>
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="history"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 py-3">
              <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-acid">
                Version history
              </p>
              <VersionHistory rule={rule} isAdmin={isAdmin} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

export function RuleBook() {
  const me = useGovMe();
  const isAdmin = me?.role === "tenant";
  const { data, isPending, isError, refetch } = useRulebook();

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        emoji="📖"
        title="Couldn't open the book"
        note="Something went wrong loading the rules."
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium"
          >
            Try again
          </button>
        }
      />
    );
  }

  if (data.rules.length === 0) {
    return (
      <EmptyState
        emoji="📖"
        title="The book is blank"
        note="Passed proposals will fill these pages."
      />
    );
  }

  // Group rules by category, preserving first-seen category order.
  const groups: { category: string; rules: RuleBookRule[] }[] = [];
  const byCategory = new Map<string, RuleBookRule[]>();
  for (const rule of data.rules) {
    let bucket = byCategory.get(rule.category);
    if (!bucket) {
      bucket = [];
      byCategory.set(rule.category, bucket);
      groups.push({ category: rule.category, rules: bucket });
    }
    bucket.push(rule);
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.category}>
          <h2 className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <span aria-hidden>{categoryEmoji(group.category)}</span>
            <span>{group.category}</span>
          </h2>
          <div className="space-y-3">
            {group.rules.map((rule) => (
              <RuleCard key={rule.id} rule={rule} isAdmin={isAdmin} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
