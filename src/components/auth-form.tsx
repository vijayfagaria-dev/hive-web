"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ComponentProps, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { OtpStep } from "@/components/auth/otp-step";
import { PasswordField } from "@/components/auth/password-field";
import { cn } from "@/lib/utils";
import { api, ApiError, type Verification } from "@/lib/api";
import { passwordAcceptable } from "@/lib/password";
import { useLogin, useRegister, useVerifyRegistration } from "@/lib/queries";

const labelCls = "font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground";

function Field({ id, label, ...props }: { id: string; label: string } & ComponentProps<typeof Input>) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className={labelCls}>
        {label}
      </Label>
      <Input id={id} name={id} className="h-12 bg-card" {...props} />
    </div>
  );
}

type Role = "tenant" | "guest";

export function AuthForm({
  mode,
  invite,
  inviteEmail,
}: {
  mode: "login" | "register";
  invite?: string;
  inviteEmail?: string | null;
}) {
  const router = useRouter();
  const login = useLogin();
  const register = useRegister();
  const verifyRegistration = useVerifyRegistration();
  const isRegister = mode === "register";
  const pending = isRegister ? register.isPending : login.isPending;
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(inviteEmail ?? "");
  const [whatsapp, setWhatsapp] = useState("");
  // Set once the signup is accepted and a code is on its way -> show the OTP step.
  const [verification, setVerification] = useState<Verification | null>(null);

  const go = (role: Role) => router.push(role === "tenant" ? "/dashboard" : "/hive");
  const fail = (err: unknown) =>
    setError(err instanceof ApiError ? err.message : "Something went wrong — try again.");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const name = username.trim();

    if (isRegister) {
      if (!passwordAcceptable(password, name)) {
        setError("Pick a stronger password — see the checklist.");
        return;
      }
      register.mutate(
        {
          username: name,
          password,
          email: email.trim(),
          whatsapp: whatsapp.trim() || null,
          invite: invite ?? null,
        },
        { onSuccess: (res) => setVerification(res.verification), onError: fail },
      );
    } else {
      login.mutate({ username: name, password }, { onSuccess: (res) => go(res.member.role), onError: fail });
    }
  }

  if (isRegister && verification) {
    return (
      <OtpStep
        verification={verification}
        submitLabel="Verify & enter the Hive →"
        onVerify={(code) =>
          verifyRegistration
            .mutateAsync({ email: verification.email, code })
            .then((res) => go(res.member.role))
        }
        onResend={() => api.registerResend(verification.email).then((r) => r.verification)}
        onBack={() => {
          setVerification(null);
          setError(null);
        }}
        backLabel="Edit details"
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field
        id="username"
        label="Username"
        autoComplete="username"
        autoFocus
        required
        minLength={isRegister ? 3 : undefined}
        maxLength={isRegister ? 32 : undefined}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      {isRegister && (
        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@flat.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="password" className={labelCls}>
            Password
          </Label>
          {!isRegister && (
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          )}
        </div>
        <PasswordField
          id="password"
          name="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          value={password}
          onValueChange={setPassword}
          meter={isRegister}
          username={username}
        />
      </div>

      {isRegister && !invite && (
        <>
          <Field
            id="whatsapp"
            label="WhatsApp (optional)"
            type="tel"
            autoComplete="tel"
            placeholder="+91…"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
          <p className="-mt-2 text-xs text-muted-foreground">
            We&apos;ll email you a code to confirm it&apos;s really you. Add WhatsApp so Hive can ping you the
            second you&apos;re accused 🚨 — enable push later in Settings.
          </p>
        </>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={cn(buttonVariants({ size: "lg" }), "mt-1 h-12 w-full rounded-lg text-base font-medium")}
      >
        {pending ? "One sec…" : isRegister ? "Send my code →" : "Enter the Hive →"}
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
