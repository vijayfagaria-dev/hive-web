import { PHASE_OF, type Phase, type Status } from "@/lib/api";
import { cn } from "@/lib/utils";

/* Color-coded badge per complaint phase (the backend collapses status → phase). */
const STYLE: Record<Phase, { label: string; cls: string }> = {
  raised: { label: "Raised", cls: "bg-amber-400/15 text-amber-700 ring-amber-500/25" },
  voting: { label: "Voting", cls: "bg-violet-400/15 text-violet-700 ring-violet-500/25" },
  registered: { label: "Registered", cls: "bg-primary/20 text-lime-800 ring-primary/30" },
  rejected: { label: "Dropped", cls: "bg-muted text-muted-foreground ring-border" },
};

export function PhaseChip({ status, phase, className }: { status?: Status; phase?: Phase; className?: string }) {
  const p = phase ?? (status ? PHASE_OF[status] : "raised");
  const s = STYLE[p];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[0.65rem] font-medium uppercase tracking-wide ring-1",
        s.cls,
        className,
      )}
    >
      {s.label}
    </span>
  );
}
