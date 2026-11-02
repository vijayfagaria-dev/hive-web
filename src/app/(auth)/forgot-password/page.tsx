import type { Metadata } from "next";
import { ForgotPasswordFlow } from "@/components/auth/forgot-password-flow";

export const metadata: Metadata = { title: "Reset password · Hive" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">Locked out</p>
      <h1 className="mt-4 text-5xl font-bold leading-[0.95] tracking-tight">
        Forgot your
        <br />
        password?
      </h1>
      <p className="mt-4 text-muted-foreground">Happens to the best of us. We&apos;ll email you a code.</p>
      <div className="mt-9">
        <ForgotPasswordFlow />
      </div>
    </div>
  );
}
