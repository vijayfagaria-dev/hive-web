"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  ["/governance", "Dashboard"],
  ["/governance/proposals", "Proposals"],
  ["/governance/rulebook", "Rule Book"],
] as const;

export function GovHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const path = usePathname();
  return (
    <header className="mb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">🏛️ Community Governance</p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-pretty text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <Link
          href="/governance/propose"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-acid"
        >
          <Plus className="size-4" /> <span className="hidden sm:inline">Propose</span>
        </Link>
      </div>
      <nav className="mt-4 flex gap-1.5">
        {TABS.map(([href, label]) => {
          const active = href === "/governance" ? path === "/governance" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
