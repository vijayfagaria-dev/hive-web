import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** A titled group of rows — the iOS-settings pattern: one card, hairline dividers. */
export function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">{title}</h2>
      <div className="glass divide-y divide-border overflow-hidden rounded-2xl">{children}</div>
    </section>
  );
}

type RowProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value?: ReactNode;
  /** Replaces the chevron (e.g. a switch). */
  trailing?: ReactNode;
  destructive?: boolean;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

/** One settings row: icon · label · current value · chevron. A link, a button, or static. */
export function SettingsRow({ icon: Icon, label, value, trailing, destructive, href, onClick, disabled }: RowProps) {
  const body = (
    <>
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg",
          destructive ? "bg-destructive/10 text-destructive" : "bg-primary/15 text-acid",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className={cn("shrink-0 text-sm font-medium", destructive && "text-destructive")}>{label}</span>
      <span className="ml-auto flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        {value != null && <span className="min-w-0 truncate">{value}</span>}
        {trailing ?? ((href || onClick) && !destructive ? <ChevronRight className="size-4 shrink-0" /> : null)}
      </span>
    </>
  );
  const cls = "flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left";
  const interactive = "transition-colors hover:bg-muted/60 disabled:opacity-50";

  if (href) {
    return (
      <Link href={href} className={cn(cls, interactive)}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={cn(cls, interactive)}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}
