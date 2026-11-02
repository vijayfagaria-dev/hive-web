import type { SpendingMonth } from "@/lib/api";
import { catEmoji, catLabel } from "@/lib/categories";
import { monthLabel, thisMonth } from "@/lib/months";

const inr = (n: number) => n.toLocaleString("en-IN");

/** Where the money went: one ranked bar per category, largest first, one hue. Each row
 *  prints its amount; hovering adds the share of the total. */
export function SpendingBreakdown({
  rows,
  empty = "Nothing spent yet this month.",
}: {
  rows: { category: string; amount: number }[];
  empty?: string;
}) {
  const ranked = rows.filter((r) => r.amount > 0).sort((a, b) => b.amount - a.amount);
  const total = ranked.reduce((s, r) => s + r.amount, 0);
  const max = ranked[0]?.amount ?? 0;

  if (!ranked.length) return <p className="text-sm text-muted-foreground">{empty}</p>;

  return (
    <ul className="space-y-3">
      {ranked.map(({ category: cat, amount: amt }) => (
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

/** Open on this month if anything's been spent yet, else on the latest month that has. */
export function defaultSpendingMonth(months: SpendingMonth[]): string {
  return (months.find((m) => m.total > 0) ?? months[0])?.month ?? thisMonth();
}

export function MonthSelect({
  months,
  value,
  onChange,
}: {
  months: SpendingMonth[];
  value: string;
  onChange: (month: string) => void;
}) {
  const current = thisMonth();
  return (
    <select
      aria-label="Month"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-lg border border-input bg-card px-2 text-xs"
    >
      {months.map(({ month }) => (
        <option key={month} value={month}>
          {monthLabel(month)}
          {month === current ? " · this month" : ""}
        </option>
      ))}
    </select>
  );
}
