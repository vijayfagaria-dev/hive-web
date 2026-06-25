"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { useLogin, useRegister } from "@/lib/queries";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const login = useLogin();
  const register = useRegister();
  const mutation = mode === "login" ? login : register;
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const username = String(data.get("username") ?? "").trim();
    const password = String(data.get("password") ?? "");
    mutation.mutate(
      { username, password },
      {
        onSuccess: (res) => router.push(res.member.role === "tenant" ? "/dashboard" : "/hive"),
        onError: (err) =>
          setError(err instanceof ApiError ? err.message : "Something went wrong — try again."),
      },
    );
  }

  const isRegister = mode === "register";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="username" className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
          Username
        </Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          autoFocus
          required
          minLength={isRegister ? 3 : undefined}
          className="h-12 bg-white/[0.03]"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={isRegister ? 6 : undefined}
          className="h-12 bg-white/[0.03]"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className={cn(buttonVariants({ size: "lg" }), "mt-1 h-12 w-full rounded-lg text-base font-medium")}
      >
        {mutation.isPending ? "One sec…" : isRegister ? "Create account →" : "Enter the Hive →"}
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
