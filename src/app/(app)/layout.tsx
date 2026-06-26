"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/queries";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, isPending } = useAuth();
  const member = data?.member ?? null;

  useEffect(() => {
    if (!isPending && !member) router.replace("/login");
  }, [isPending, member, router]);

  if (isPending || !member) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="size-8 animate-pulse rounded-full bg-primary/30" />
      </div>
    );
  }

  return <AppShell member={member}>{children}</AppShell>;
}
