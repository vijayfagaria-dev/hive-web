import { cn } from "@/lib/utils";

type Tok = { t: "eq" | "add" | "del"; w: string };

/** Word-level LCS diff so we can render GitHub-style additions/deletions. */
function diffWords(a: string, b: string): Tok[] {
  const aw = a.split(/(\s+)/);
  const bw = b.split(/(\s+)/);
  const m = aw.length;
  const n = bw.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i]![j] = (aw[i] ?? "") === (bw[j] ?? "")
        ? (dp[i + 1]?.[j + 1] ?? 0) + 1
        : Math.max(dp[i + 1]?.[j] ?? 0, dp[i]?.[j + 1] ?? 0);
    }
  }
  const out: Tok[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if ((aw[i] ?? "") === (bw[j] ?? "")) {
      out.push({ t: "eq", w: aw[i] ?? "" });
      i++;
      j++;
    } else if ((dp[i + 1]?.[j] ?? 0) >= (dp[i]?.[j + 1] ?? 0)) {
      out.push({ t: "del", w: aw[i] ?? "" });
      i++;
    } else {
      out.push({ t: "add", w: bw[j] ?? "" });
      j++;
    }
  }
  while (i < m) out.push({ t: "del", w: aw[i++] ?? "" });
  while (j < n) out.push({ t: "add", w: bw[j++] ?? "" });
  return out;
}

export function RuleDiff({ current, proposed }: { current: string | null; proposed: string }) {
  if (!current) {
    return (
      <div className="overflow-hidden rounded-xl border border-border font-mono text-sm leading-relaxed">
        <div className="border-b border-border bg-muted/50 px-3 py-1.5 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
          New rule
        </div>
        <p className="bg-primary/10 px-3 py-2.5 text-foreground">
          <span className="mr-1 select-none text-lime-700">+</span>
          {proposed}
        </p>
      </div>
    );
  }

  const toks = diffWords(current, proposed);
  return (
    <div className="overflow-hidden rounded-xl border border-border font-mono text-sm leading-relaxed">
      <div className="border-b border-border bg-muted/50 px-3 py-1.5 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
        Current → Proposed
      </div>
      <p className="px-3 py-2.5">
        {toks.map((tok, i) =>
          tok.t === "eq" ? (
            <span key={i}>{tok.w}</span>
          ) : tok.t === "add" ? (
            <span key={i} className="rounded bg-primary/20 text-lime-800">
              {tok.w}
            </span>
          ) : (
            <span key={i} className="rounded bg-destructive/15 text-destructive line-through decoration-destructive/60">
              {tok.w}
            </span>
          ),
        )}
      </p>
      <div className={cn("flex gap-4 border-t border-border bg-muted/30 px-3 py-1.5 text-[0.65rem] uppercase tracking-wider")}>
        <span className="text-lime-700">+ additions</span>
        <span className="text-destructive">− deletions</span>
      </div>
    </div>
  );
}
