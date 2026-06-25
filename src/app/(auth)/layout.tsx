import Link from "next/link";
import type { ReactNode } from "react";
import { AuthAside } from "@/components/auth/auth-aside";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <AuthAside />
      <main className="relative flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-12 inline-block font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            Hive
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
