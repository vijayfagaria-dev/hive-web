import { cn } from "@/lib/utils";

/** Horizontal yes/no tally bar with an animated fill (lime yes vs destructive no, proportional
 *  to yes+no — abstain is excluded from the ratio). The server decides pass/fail, so no marker. */
export function VoteBar({
  yes,
  no,
  abstain,
  className,
}: {
  yes: number;
  no: number;
  abstain?: number;
  className?: string;
}) {
  const decided = yes + no;
  const yesPct = decided ? (yes / decided) * 100 : 0;
  const showAbstain = abstain !== undefined && abstain > 0;
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-destructive/20">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${yesPct}%` }}
        />
      </div>
      <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
        <span className="font-medium text-lime-700">👍 {yes}</span>
        {showAbstain && <span className="text-muted-foreground">🤷 {abstain}</span>}
        <span className="font-medium text-destructive">👎 {no}</span>
      </div>
    </div>
  );
}
