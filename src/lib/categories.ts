/** Expense categories — the one label/emoji table (mirrors the API's ExpenseCategory enum). */
export const EXPENSE_CATEGORIES: { v: string; label: string; emoji: string }[] = [
  { v: "groceries", label: "Groceries", emoji: "🛒" },
  { v: "maintenance", label: "Maintenance", emoji: "🔧" },
  { v: "internet", label: "Wifi", emoji: "📶" },
  { v: "house_help", label: "House help", emoji: "🧹" },
  { v: "cook", label: "Cook", emoji: "🍳" },
  { v: "broker", label: "Broker", emoji: "🧑‍💼" },
  { v: "misc", label: "Misc", emoji: "🧾" },
  { v: "rent", label: "Rent", emoji: "🏠" },
];

/** Everything but rent — rent is recorded through the rent flow, not a free-form expense. */
export const SPLIT_CATEGORIES = EXPENSE_CATEGORIES.filter((c) => c.v !== "rent");

const BY_VALUE = new Map(EXPENSE_CATEGORIES.map((c) => [c.v, c]));

export const catEmoji = (v: string) => BY_VALUE.get(v)?.emoji ?? "🧾";
export const catLabel = (v: string) => BY_VALUE.get(v)?.label ?? v;
