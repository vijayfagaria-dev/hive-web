import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Log in · Hive" };

export default function LoginPage() {
  return (
    <div className="flex flex-col">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">Members only</p>
      <h1 className="mt-4 text-5xl font-bold leading-[0.95] tracking-tight">
        Welcome
        <br />
        back.
      </h1>
      <p className="mt-4 text-muted-foreground">Your reputation precedes you.</p>
      <div className="mt-9">
        <AuthForm mode="login" />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Just visiting?{" "}
        <Link href="/directions" className="font-medium text-foreground underline underline-offset-4">
          Get directions
        </Link>{" "}
        — no account needed.
      </p>
    </div>
  );
}
