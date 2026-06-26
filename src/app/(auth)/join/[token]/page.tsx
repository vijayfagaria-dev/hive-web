"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { usePreviewInvite } from "@/lib/queries";
import { AuthForm } from "@/components/auth-form";

export default function JoinPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const preview = usePreviewInvite(token);

  return (
    <div className="flex flex-col">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">You&apos;re invited</p>
      <h1 className="mt-4 text-5xl font-bold leading-[0.95] tracking-tight">
        Join the
        <br />
        Hive.
      </h1>

      {preview.isPending ? (
        <p className="mt-4 text-muted-foreground">Checking your invite…</p>
      ) : preview.isError || !preview.data ? (
        <div className="mt-4 space-y-3">
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            This invite link is invalid or has expired.
          </p>
          <Link href="/register" className="text-sm font-medium text-foreground underline underline-offset-4">
            Register as a guest instead →
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-4 text-pretty text-muted-foreground">
            {preview.data.invitedBy ? (
              <>
                <span className="font-medium text-foreground">{preview.data.invitedBy}</span> invited you
              </>
            ) : (
              "You've been invited"
            )}{" "}
            to join as a{" "}
            <span className="font-semibold text-foreground">
              {preview.data.role === "tenant" ? "tenant (admin)" : "guest"}
            </span>
            {preview.data.name ? (
              <>
                {" — as "}
                <span className="font-medium text-foreground">{preview.data.name}</span>
              </>
            ) : null}
            .
          </p>
          <div className="mt-9">
            <AuthForm mode="register" invite={token} />
          </div>
        </>
      )}
    </div>
  );
}
