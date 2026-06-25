"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Member } from "@/lib/api";
import { useLogout } from "@/lib/queries";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-sm transition-colors",
        active ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function AppNav({ member }: { member: Member }) {
  const router = useRouter();
  const logout = useLogout();
  const isTenant = member.role === "tenant";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href={isTenant ? "/dashboard" : "/hive"}
          className="font-mono text-sm font-semibold uppercase tracking-[0.2em]"
        >
          Hive
        </Link>
        <nav className="flex items-center gap-1">
          {isTenant && <NavLink href="/dashboard">Dashboard</NavLink>}
          <NavLink href="/hive">Home</NavLink>
          <NavLink href="/pay">Pay</NavLink>
          <button
            type="button"
            onClick={() => logout.mutate(undefined, { onSuccess: () => router.replace("/login") })}
            className="ml-1 rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
