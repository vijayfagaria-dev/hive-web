import type { Expense } from "@/lib/api";
import { catEmoji, catLabel } from "@/lib/categories";

const inr = (n: number) => n.toLocaleString("en-IN");

/** Where the money went: one ranked bar per category, largest first, one hue. Each row
 *  prints its amount; hovering adds the share of the total. */
export function SpendingBreakdown({ expenses }: { expenses: Expense[] }) {
  const totals = new Map<string, number>();
  for (const e of expenses) {
    if (e.status !== "void") totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  }
  const rows = [...totals].sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((s, [, amt]) => s + amt, 0);
  const max = rows[0]?.[1] ?? 0;

  if (!rows.length) return <p className="text-sm text-muted-foreground">Nothing spent yet this month.</p>;

  return (
    <ul className="space-y-3">
      {rows.map(([cat, amt]) => (
        <li
          key={cat}
          title={`${catLabel(cat)}: ₹${inr(amt)} · ${Math.round((amt / total) * 100)}% of ₹${inr(total)}`}
          className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-sm"
        >
          <span className="truncate">
            {catEmoji(cat)} {catLabel(cat)}
          </span>
          <span className="h-2.5">
            <span className="block h-full rounded-r-[4px] bg-primary" style={{ width: `${(amt / max) * 100}%` }} />
          </span>
          <span className="tabular-nums text-muted-foreground">₹{inr(amt)}</span>
        </li>
      ))}
    </ul>
  );
}
