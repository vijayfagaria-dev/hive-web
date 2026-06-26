import type { Role } from "@/lib/api";
import { cn } from "@/lib/utils";

const META: Record<Role, { label: string; cls: string }> = {
  tenant: { label: "Tenant · admin", cls: "bg-primary/15 text-lime-800 ring-primary/30" },
  guest: { label: "Guest", cls: "bg-muted text-muted-foreground ring-border" },
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const m = META[role];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[0.65rem] font-medium uppercase tracking-wide ring-1",
        m.cls,
        className,
      )}
    >
      {m.label}
    </span>
  );
}
