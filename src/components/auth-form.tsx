"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ComponentProps, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { useLogin, useRegister } from "@/lib/queries";

function Field({ id, label, ...props }: { id: string; label: string } & ComponentProps<typeof Input>) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </Label>
      <Input id={id} name={id} className="h-12 bg-card" {...props} />
    </div>
  );
}

export function AuthForm({ mode, invite }: { mode: "login" | "register"; invite?: string }) {
  const router = useRouter();
  const login = useLogin();
  const register = useRegister();
  const isRegister = mode === "register";
  const pending = isRegister ? register.isPending : login.isPending;
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const username = String(data.get("username") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const go = (res: { member: { role: "tenant" | "guest" } }) =>
      router.push(res.member.role === "tenant" ? "/dashboard" : "/hive");
    const fail = (err: unknown) =>
      setError(err instanceof ApiError ? err.message : "Something went wrong — try again.");

    if (isRegister) {
      const email = String(data.get("email") ?? "").trim();
      const whatsapp = String(data.get("whatsapp") ?? "").trim();
      register.mutate(
        { username, password, email: email || null, whatsapp: whatsapp || null, invite: invite ?? null },
        { onSuccess: go, onError: fail },
      );
    } else {
      login.mutate({ username, password }, { onSuccess: go, onError: fail });
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field id="username" label="Username" autoComplete="username" autoFocus required minLength={isRegister ? 3 : undefined} />
      <Field
        id="password"
        label="Password"
        type="password"
        autoComplete={isRegister ? "new-password" : "current-password"}
        required
        minLength={isRegister ? 6 : undefined}
      />

      {isRegister && !invite && (
        <>
          <Field id="email" label="Email (optional)" type="email" autoComplete="email" placeholder="you@flat.com" />
          <Field id="whatsapp" label="WhatsApp (optional)" type="tel" autoComplete="tel" placeholder="+91…" />
          <p className="-mt-2 text-xs text-muted-foreground">
            Add these so Hive can ping you the second you&apos;re accused 🚨 — enable push later in Settings.
          </p>
        </>
      )}

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className={cn(buttonVariants({ size: "lg" }), "mt-1 h-12 w-full rounded-lg text-base font-medium")}
      >
        {pending ? "One sec…" : isRegister ? "Create account →" : "Enter the Hive →"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {isRegister ? "Already in?" : "New here?"}{" "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {isRegister ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
