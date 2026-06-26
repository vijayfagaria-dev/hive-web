"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  PHASE_META,
  yesPct,
  useVoteProposal,
  type GovUser,
  type ProposalChoice,
  type ProposalDetail,
} from "@/lib/governance";
import { ApiError } from "@/lib/api";
import { VoteRing } from "./vote-ring";
import { VoteBar } from "./vote-bar";
import { ConfettiBurst } from "@/components/app/confetti-burst";
import { cn } from "@/lib/utils";

const CHOICES: { value: ProposalChoice; label: string; selectedCls: string; hoverCls: string }[] = [
  {
    value: "yes",
    label: "👍 Support",
    selectedCls: "bg-primary text-primary-foreground glow-acid",
    hoverCls: "border border-border hover:border-acid hover:text-acid",
  },
  {
    value: "abstain",
    label: "🤷 Abstain",
    selectedCls: "bg-muted-foreground/15 text-foreground ring-2 ring-muted-foreground/40",
    hoverCls: "border border-border hover:border-foreground",
  },
  {
    value: "no",
    label: "👎 Oppose",
    selectedCls: "bg-foreground text-background",
    hoverCls: "border border-border hover:border-foreground",
  },
];

export function VotePanel({ proposal, me }: { proposal: ProposalDetail; me: GovUser | null }) {
  const reduce = useReducedMotion();
  const vote = useVoteProposal(proposal.id);
  const { vote: v, phase } = proposal;
  const [castError, setCastError] = useState<string | null>(null);

  // Fire confetti exactly once when a passed proposal is on screen.
  const [boom, setBoom] = useState(false);
  useEffect(() => {
    if (phase !== "passed") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot celebration when a passed proposal mounts
    setBoom(true);
  }, [phase]);

  const turnout = v.yes + v.no + v.abstain;
  const tone =
    phase === "passed" ? "passed" : phase === "rejected" || phase === "cancelled" ? "rejected" : "live";

  function cast(choice: ProposalChoice) {
    setCastError(null);
    vote.mutate(choice, {
      onError: (e) => setCastError(e instanceof ApiError ? e.message : "Couldn't record that vote."),
    });
  }

  return (
    <section className="glass rounded-2xl p-5">
      {phase === "passed" && <ConfettiBurst fire={boom} />}

      <div className="flex flex-col items-center gap-4">
        <VoteRing pct={yesPct(v)} tone={tone} size={120} stroke={11} />
        <VoteBar yes={v.yes} no={v.no} abstain={v.abstain} className="w-full" />
        <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
          {turnout}/{v.eligible} tenants voted
        </p>
      </div>

      {/* live region announcing the tally on each vote */}
      <p className="sr-only" aria-live="polite">
        {v.yes} in support, {v.no} opposed, {v.abstain} abstaining. {Math.round(yesPct(v))} percent support.
      </p>

      {proposal.canVote ? (
        <>
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {CHOICES.map((c) => {
              const selected = v.myVote === c.value;
              return (
                <motion.button
                  key={c.value}
                  type="button"
                  whileTap={reduce ? undefined : { scale: 0.96 }}
                  disabled={vote.isPending}
                  onClick={() => cast(c.value)}
                  aria-pressed={selected}
                  aria-label={`Vote ${c.value}`}
                  className={cn(
                    "min-h-14 rounded-2xl px-2 text-sm font-bold transition-colors disabled:opacity-60",
                    selected ? c.selectedCls : c.hoverCls,
                  )}
                >
                  {c.label}
                </motion.button>
              );
            })}
          </div>
          {castError ? (
            <p className="mt-3 text-center text-xs text-destructive">{castError}</p>
          ) : v.myVote ? (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              You voted <span className="font-semibold text-foreground">{v.myVote}</span> — tap another to change.
            </p>
          ) : (
            <p className="mt-3 text-center text-xs text-muted-foreground">Cast your vote — you can change it until voting closes.</p>
          )}
        </>
      ) : phase === "voting" && me?.role === "guest" ? (
        <p className="mt-5 rounded-2xl bg-muted/60 px-4 py-3 text-center text-sm text-muted-foreground">
          Only tenants vote on rule proposals — you can still comment below.
        </p>
      ) : (
        <div className="mt-5 rounded-2xl bg-muted/60 px-4 py-3 text-center">
          <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            {PHASE_META[phase].emoji} {PHASE_META[phase].label}
          </p>
          {proposal.resolutionDetail && <p className="mt-1 text-sm font-medium">{proposal.resolutionDetail}</p>}
          {phase === "passed" && <p className="mt-1 text-sm font-medium">📖 Merged into the Rule Book.</p>}
          {v.myVote && (
            <p className="mt-2 text-xs text-muted-foreground">
              You voted <span className="font-semibold text-foreground">{v.myVote}</span>.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
