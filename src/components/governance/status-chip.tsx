import { PHASE_META, type ProposalPhase } from "@/lib/governance";
import { cn } from "@/lib/utils";

/** Phase hues — voting=lime/primary, review=amber, passed=sky, rejected=destructive, draft/cancelled=muted. */
const STYLE: Record<ProposalPhase, string> = {
  draft: "bg-muted text-muted-foreground ring-border",
  review: "bg-amber-400/15 text-amber-700 ring-amber-500/30",
  voting: "bg-primary/15 text-lime-800 ring-primary/30",
  passed: "bg-sky-400/15 text-sky-700 ring-sky-500/30",
  rejected: "bg-destructive/12 text-destructive ring-destructive/25",
  cancelled: "bg-muted text-muted-foreground ring-border",
};

/** Animated, color-coded phase chip (active voting pulses). */
export function StatusChip({ phase, className }: { phase: ProposalPhase; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[0.65rem] font-medium uppercase tracking-wide ring-1",
        STYLE[phase],
        className,
      )}
    >
      {phase === "voting" ? (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-70 motion-reduce:hidden" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : (
        <span className="size-1.5 rounded-full bg-current" />
      )}
      {PHASE_META[phase].label}
    </span>
  );
}
