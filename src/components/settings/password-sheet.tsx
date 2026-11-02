"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { passwordAcceptable } from "@/lib/password";
import { useChangePassword } from "@/lib/queries";
import { Sheet } from "@/components/app/sheet";
import { PasswordField } from "@/components/auth/password-field";

const fieldCls =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";
const labelCls = "mb-1.5 block text-sm font-medium";

export function PasswordSheet({
  open,
  onClose,
  username,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  username?: string;
  onDone: (msg: string) => void;
}) {
  const changePassword = useChangePassword();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (!passwordAcceptable(next, username)) return setError("Pick a stronger new password — see the checklist.");
    if (next !== confirm) return setError("New passwords don't match.");
    try {
      await changePassword.mutateAsync({ currentPassword: cur, newPassword: next });
      onDone("Password updated — other devices were signed out");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't change your password.");
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Change password">
      <label className="block">
        <span className={labelCls}>Current password</span>
        <input type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} className={fieldCls} />
      </label>
      <label className="mt-3 block">
        <span className={labelCls}>New password</span>
        <PasswordField
          autoComplete="new-password"
          value={next}
          onValueChange={setNext}
          placeholder="at least 8 characters"
          meter
          username={username}
          className="h-11 rounded-xl text-sm"
        />
      </label>
      <label className="mt-3 block">
        <span className={labelCls}>Confirm new password</span>
        <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={fieldCls} />
      </label>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={changePassword.isPending || !cur || !next || !confirm}
        className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {changePassword.isPending ? "Updating…" : "Update password"}
      </button>
    </Sheet>
  );
}
