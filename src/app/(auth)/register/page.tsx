import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Join · Hive" };

export default function RegisterPage() {
  return (
    <div className="flex flex-col">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">New here</p>
      <h1 className="mt-4 text-5xl font-bold leading-[0.95] tracking-tight">
        Join the
        <br />
        Hive.
      </h1>
      <p className="mt-4 text-muted-foreground">You start as a guest. Behave accordingly.</p>
      <div className="mt-9">
        <AuthForm mode="register" />
      </div>
    </div>
  );
}
