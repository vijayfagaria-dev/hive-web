"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/queries";

// Tenant-only screens → where a guest lands instead. The one frontend gate, mirroring the
// API's tenant-only reads, so these pages never carry a guest branch. Exact paths:
// /complaints/new (report) and /complaints/:id stay open to guests.
const GUEST_REDIRECTS: Record<string, string> = {
  "/dashboard": "/hive",
  "/bills": "/hive",
  "/complaints": "/hive",
  "/expenses": "/pay",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isPending } = useAuth();
  const member = data?.member ?? null;
  const guestRedirect = member && member.role !== "tenant" ? GUEST_REDIRECTS[pathname] : undefined;

  useEffect(() => {
    if (!isPending && !member) router.replace("/login");
    else if (guestRedirect) router.replace(guestRedirect);
  }, [isPending, member, guestRedirect, router]);

  if (isPending || !member || guestRedirect) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="size-8 animate-pulse rounded-full bg-primary/30" />
      </div>
    );
  }

  return <AppShell member={member}>{children}</AppShell>;
}
