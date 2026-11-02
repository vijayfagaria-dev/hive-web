/** 'YYYY-MM' month helpers, in the viewer's local time (not UTC — early on the 1st,
 *  `toISOString()` would still say last month). */

export function thisMonth(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parts(month: string): [number, number] {
  return [Number(month.slice(0, 4)), Number(month.slice(5, 7))];
}

export function addMonths(month: string, n: number): string {
  const [y, m] = parts(month);
  return thisMonth(new Date(y, m - 1 + n, 1));
}

/** 'Nov 2026' */
export function monthLabel(month: string): string {
  const [y, m] = parts(month);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "short", year: "numeric" });
}
