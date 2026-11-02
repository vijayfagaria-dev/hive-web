"use client";

import { useState } from "react";
import { api, ApiError, type Verification } from "@/lib/api";
import { useSetEmail, useVerifyEmail } from "@/lib/queries";
import { Sheet } from "@/components/app/sheet";
import { OtpStep } from "@/components/auth/otp-step";

const fieldCls =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

/** Change or verify your email. Any address that needs proving moves straight to the
 *  code step in this same sheet — a code is never sent without somewhere to enter it.
 *  Mount it only while open, so each opening starts from the saved value. */
export function EmailSheet({
  open,
  onClose,
  current,
  verified,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  current: string;
  verified: boolean;
  onDone: (msg: string) => void;
}) {
  const setEmail = useSetEmail();
  const verifyEmail = useVerifyEmail();
  const [email, setEmailV] = useState(current);
  const [pending, setPending] = useState<Verification | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmed = email.trim();
  const unchanged = trimmed.toLowerCase() === current.toLowerCase();
  const needsVerify = unchanged && !!current && !verified;

  async function submit() {
    setError(null);
    try {
      const res = await setEmail.mutateAsync(trimmed || null);
      if (res.pending) setPending(res.pending);
      else {
        onDone(trimmed ? "Email saved" : "Email removed");
        onClose();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your email.");
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={pending ? "Check your inbox" : "Email"}>
      {pending ? (
        <OtpStep
          compact
          verification={pending}
          submitLabel="Confirm email"
          onVerify={(code) =>
            verifyEmail.mutateAsync({ email: pending.email, code }).then(() => {
              onDone("Email verified");
              onClose();
            })
          }
          onResend={() => api.resendEmailCode(pending.email).then((r) => r.pending ?? pending)}
          onBack={() => setPending(null)}
          backLabel="Use a different email"
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Used for alerts and password resets. We&apos;ll send a code to confirm it&apos;s yours.
          </p>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmailV(e.target.value)}
            placeholder="you@example.com"
            className={`${fieldCls} mt-4`}
          />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={setEmail.isPending || (unchanged && !needsVerify)}
            className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {setEmail.isPending ? "Sending…" : needsVerify ? "Send verification code" : trimmed ? "Send code" : "Remove email"}
          </button>
        </>
      )}
    </Sheet>
  );
}
