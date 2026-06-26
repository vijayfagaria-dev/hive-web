import { cn } from "@/lib/utils";

/* Deterministic initials avatar — a warm colour derived from the name. */
const COLORS = ["#c8775a", "#5a9aa0", "#d8a23a", "#7fa81a", "#9a6cc0", "#d24b6a", "#4f8a4a", "#e0814a"];

function pick(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "");
  return letters.toUpperCase() || "?";
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-white", className)}
      style={{ background: pick(name) }}
    >
      {initials(name)}
    </span>
  );
}
