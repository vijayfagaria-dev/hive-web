"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { Bell, Coins, Home, Plus, Scale, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelfMember } from "@/lib/api";
import { useNotifications, usePublicStats } from "@/lib/queries";

const inr = (n: number) => n.toLocaleString("en-IN");

/** Thumb-reachable shell: top bar (pot + bell) + bottom tab bar with a center compose FAB. */
export function AppShell({ member, children }: { member: SelfMember; children: ReactNode }) {
  const pathname = usePathname();
  const { data } = usePublicStats();
  const unread = useNotifications().data?.unread ?? 0;
  const isTenant = member.role === "tenant";
  const homeHref = isTenant ? "/dashboard" : "/hive";

  const on = (...hrefs: string[]) =>
    hrefs.some((h) => pathname === h || pathname.startsWith(`${h}/`));

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl">
        <Link href={homeHref} className="font-mono text-sm font-semibold uppercase tracking-[0.18em]">
          hive
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm font-semibold tabular-nums">
            🫙 ₹{inr(data?.pot ?? 0)}
          </span>
          <Link
            href="/notifications"
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
            className="relative grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[0.6rem] font-bold leading-4 text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="flex-1 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-2">
          <Tab href={homeHref} label="Home" icon={Home} active={on(homeHref, "/hive", "/dashboard")} />
          <Tab href="/complaints" label="Feed" icon={Scale} active={on("/complaints") && !on("/complaints/new")} />
          <Fab href="/complaints/new" active={on("/complaints/new")} />
          <Tab href="/pay" label="Pot" icon={Coins} active={on("/pay")} />
          <Tab href="/settings" label="You" icon={User} active={on("/settings")} />
        </div>
      </nav>
    </div>
  );
}

function Tab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <span className={cn("grid size-9 place-items-center rounded-full transition-colors", active && "bg-primary/15")}>
        <Icon className={cn("size-5", active && "text-acid")} />
      </span>
      {label}
    </Link>
  );
}

function Fab({ href, active }: { href: string; active: boolean }) {
  return (
    <div className="flex justify-center">
      <Link
        href={href}
        aria-label="Report a complaint"
        className={cn(
          "grid size-14 -translate-y-3 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-transform active:scale-95 glow-acid",
          active && "scale-105",
        )}
      >
        <Plus className="size-7" strokeWidth={2.5} />
      </Link>
    </div>
  );
}
