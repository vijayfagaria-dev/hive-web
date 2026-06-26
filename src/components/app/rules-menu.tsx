"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Rule } from "@/lib/api";

/** House rules as a menu, grouped by category (favorites flagged), optionally searchable.
 *  `onPick` turns each row into a button to start a complaint from that rule. */
export function RulesMenu({
  rulesByCategory,
  searchable = false,
  onPick,
}: {
  rulesByCategory: Record<string, Rule[]>;
  searchable?: boolean;
  onPick?: (rule: Rule) => void;
}) {
  const [q, setQ] = useState("");

  const entries = useMemo(() => {
    const all = Object.entries(rulesByCategory);
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all
      .map(([cat, rules]) => [cat, rules.filter((r) => r.text.toLowerCase().includes(needle) || cat.toLowerCase().includes(needle))] as const)
      .filter(([, rules]) => rules.length > 0);
  }, [rulesByCategory, q]);

  return (
    <div>
      {searchable && (
        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search rules…"
            aria-label="Search rules"
            className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        </div>
      )}
      <div className="space-y-6">
        {entries.map(([cat, rules]) => (
          <div key={cat}>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-acid">{cat}</h3>
            <ul className="mt-2 divide-y divide-border">
              {rules.map((r) => {
                const inner = (
                  <>
                    <span className="flex-1 text-left text-sm">
                      {r.isFavorite && "⭐ "}
                      {r.text}
                    </span>
                    <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">₹{r.amount}</span>
                  </>
                );
                return (
                  <li key={r.id}>
                    {onPick ? (
                      <button
                        type="button"
                        onClick={() => onPick(r)}
                        className="flex w-full items-center gap-3 py-2.5 transition-colors hover:text-acid"
                      >
                        {inner}
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 py-2.5">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {entries.length === 0 && <p className="text-sm text-muted-foreground">No rules match “{q}”.</p>}
      </div>
    </div>
  );
}
