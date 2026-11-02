"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft, Check, MailCheck, RotateCw } from "lucide-react";
import { ApiError, type Verification } from "@/lib/api";
import { formatClock, useCountdown } from "@/lib/use-countdown";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OtpInput } from "./otp-input";

/** The "enter the code we emailed you" step shared by signup, password reset, and
 *  email change: 6-box input (auto-submits), expiry countdown, resend with cooldown,
 *  and inline error/success states. `onVerify` throws an ApiError on a bad code. */
export function OtpStep({
  verification,
  onVerify,
  onResend,
  onBack,
  backLabel = "Use a different email",
  submitLabel = "Verify",
  compact = false,
  children,
}: {
  verification: Verification;
  onVerify: (code: string) => Promise<unknown>;
  onResend: () => Promise<Verification>;
  onBack?: () => void;
  backLabel?: string;
  submitLabel?: string;
  /** Tighter layout for use inside a settings card. */
  compact?: boolean;
  children?: ReactNode;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [done, setDone] = useState(false);
  const [expiresIn, startExpiry] = useCountdown(verification.expiresIn);
  const [resendIn, startResend] = useCountdown(verification.resendIn);
  const expired = expiresIn <= 0;

  async function verify(value: string) {
    if (busy || value.length !== 6) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await onVerify(value);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't check that code — try again.");
      setCode("");
      setShake((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setResending(true);
    setError(null);
    setNotice(null);
    try {
      const next = await onResend();
      startExpiry(next.expiresIn);
      startResend(next.resendIn);
      setCode("");
      setNotice("New code sent — the old one no longer works.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send a new code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className={cn("flex flex-col", compact ? "gap-4" : "gap-6")}>
      {!compact && (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-acid-dim" aria-hidden />
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="[overflow-wrap:anywhere] font-medium text-foreground">{verification.email}</span>. Check spam
            if it&apos;s not there in a minute.
          </p>
        </div>
      )}
      {compact && (
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to <span className="[overflow-wrap:anywhere] font-medium text-foreground">{verification.email}</span>.
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          verify(code);
        }}
        className="flex flex-col gap-4"
      >
        <OtpInput
          key={shake}
          value={code}
          onChange={(v) => {
            setCode(v);
            if (error) setError(null);
          }}
          onComplete={verify}
          disabled={busy || done || expired}
          invalid={shake > 0 && !!error}
        />

        <p
          className={cn(
            "text-center font-mono text-xs tabular-nums",
            expired ? "text-destructive" : expiresIn <= 60 ? "text-foreground" : "text-muted-foreground",
          )}
          aria-live="polite"
        >
          {expired ? "This code has expired — request a new one." : `Code expires in ${formatClock(expiresIn)}`}
        </p>

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {notice && !error && (
          <p role="status" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || done || expired || code.length !== 6}
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 w-full rounded-lg text-base font-medium",
            compact && "h-11 rounded-full text-sm",
          )}
        >
          {done ? (
            <>
              <Check className="size-4" /> Verified
            </>
          ) : busy ? (
            "Checking…"
          ) : (
            submitLabel
          )}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> {backLabel}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={resend}
          disabled={resendIn > 0 || resending || done}
          className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
        >
          <RotateCw className={cn("size-3.5", resending && "animate-spin")} aria-hidden />
          {resending ? "Sending…" : resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
        </button>
      </div>
      {children}
    </div>
  );
}
