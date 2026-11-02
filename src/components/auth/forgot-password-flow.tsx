"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CircleCheck } from "lucide-react";
import { api, ApiError, type Verification } from "@/lib/api";
import { passwordAcceptable } from "@/lib/password";
import { useForgotPassword, useResetPassword, useVerifyResetCode } from "@/lib/queries";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { OtpStep } from "./otp-step";
import { PasswordField } from "./password-field";

type Step =
  | { name: "email" }
  | { name: "code"; verification: Verification }
  | { name: "password"; email: string; resetToken: string }
  | { name: "done"; role: "tenant" | "guest" };

const labelCls = "font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground";
const STEPS = ["email", "code", "password"] as const;

/** Forgot password: email -> emailed code -> new password -> signed in. The email
 *  step never reveals whether an account exists (the server answers identically). */
export function ForgotPasswordFlow() {
  const router = useRouter();
  const forgot = useForgotPassword();
  const verifyCode = useVerifyResetCode();
  const reset = useResetPassword();
  const [step, setStep] = useState<Step>({ name: "email" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fail = (err: unknown) =>
    setError(err instanceof ApiError ? err.message : "Something went wrong — try again.");

  function requestCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    forgot.mutate(email.trim(), {
      onSuccess: (res) => setStep({ name: "code", verification: res.verification }),
      onError: fail,
    });
  }

  function setNewPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step.name !== "password") return;
    setError(null);
    if (!passwordAcceptable(password)) {
      setError("Pick a stronger password — see the checklist.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    reset.mutate(
      { resetToken: step.resetToken, newPassword: password },
      {
        onSuccess: (res) => {
          setStep({ name: "done", role: res.member.role });
          window.setTimeout(() => router.push(res.member.role === "tenant" ? "/dashboard" : "/hive"), 1400);
        },
        onError: (err) => {
          // An expired reset session can't be retried — send them back to the start.
          if (err instanceof ApiError && err.status === 400) setStep({ name: "email" });
          fail(err);
        },
      },
    );
  }

  const current = STEPS.indexOf(step.name as (typeof STEPS)[number]);

  return (
    <div className="flex flex-col gap-6">
      {step.name !== "done" && (
        <ol className="flex gap-1.5" aria-label={`Step ${current + 1} of 3`}>
          {STEPS.map((s, i) => (
            <li key={s} className={cn("h-1 flex-1 rounded-full bg-muted transition-colors", i <= current && "bg-acid")} />
          ))}
        </ol>
      )}

      {step.name === "email" && (
        <form onSubmit={requestCode} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className={labelCls}>
              Account email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              placeholder="you@flat.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-card"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={forgot.isPending}
            className={cn(buttonVariants({ size: "lg" }), "h-12 w-full rounded-lg text-base font-medium")}
          >
            {forgot.isPending ? "One sec…" : "Email me a code →"}
          </button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            No email on your account? Ask a tenant to reset it for you.
          </p>
        </form>
      )}

      {step.name === "code" && (
        <OtpStep
          verification={step.verification}
          submitLabel="Continue →"
          onVerify={(code) =>
            verifyCode
              .mutateAsync({ email: step.verification.email, code })
              .then((res) => {
                setError(null);
                setStep({ name: "password", email: step.verification.email, resetToken: res.resetToken });
              })
          }
          onResend={() => api.passwordResend(step.verification.email).then((r) => r.verification)}
          onBack={() => setStep({ name: "email" })}
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            If this email has a Hive account, the code is on its way.
          </p>
        </OtpStep>
      )}

      {step.name === "password" && (
        <form onSubmit={setNewPassword} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password" className={labelCls}>
              New password
            </Label>
            <PasswordField
              id="new-password"
              autoComplete="new-password"
              autoFocus
              required
              value={password}
              onValueChange={setPassword}
              meter
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password" className={labelCls}>
              Confirm new password
            </Label>
            <PasswordField
              id="confirm-password"
              autoComplete="new-password"
              required
              value={confirm}
              onValueChange={setConfirm}
              aria-invalid={confirm.length > 0 && confirm !== password ? true : undefined}
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={reset.isPending || !password || !confirm}
            className={cn(buttonVariants({ size: "lg" }), "h-12 w-full rounded-lg text-base font-medium")}
          >
            {reset.isPending ? "Saving…" : "Set new password"}
          </button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            This signs you out on every other device.
          </p>
        </form>
      )}

      {step.name === "done" && (
        <div role="status" className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-10 text-center">
          <CircleCheck className="size-10 text-acid-dim" aria-hidden />
          <p className="text-lg font-semibold">Password updated.</p>
          <p className="text-sm text-muted-foreground">You&apos;re signed in — taking you to the Hive…</p>
        </div>
      )}

      {step.name !== "done" && (
        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Back to log in
          </Link>
        </p>
      )}
    </div>
  );
}
