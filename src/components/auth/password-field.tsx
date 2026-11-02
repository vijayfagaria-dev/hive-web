"use client";

import { useState, type ComponentProps } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { passwordChecks, passwordScore, SCORE_LABELS } from "@/lib/password";
import { cn } from "@/lib/utils";

/** Password input with a show/hide toggle; `meter` adds the live strength bar and
 *  the policy checklist (mirrors the server's rules). */
export function PasswordField({
  value,
  onValueChange,
  meter = false,
  username,
  className,
  ...props
}: {
  value: string;
  onValueChange: (v: string) => void;
  meter?: boolean;
  username?: string;
} & Omit<ComponentProps<"input">, "value" | "onChange" | "type">) {
  const [show, setShow] = useState(false);
  const score = passwordScore(value, username);
  const checks = passwordChecks(value, username);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          {...props}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className={cn(
            "h-12 w-full min-w-0 rounded-lg border border-input bg-card px-2.5 pr-11 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm",
            className,
          )}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground transition-colors hover:text-foreground"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {meter && value.length > 0 && (
        <div className="flex flex-col gap-2" aria-live="polite">
          <div className="flex items-center gap-3">
            <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden>
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full bg-muted transition-colors",
                    i <= score && (score <= 1 ? "bg-destructive" : score === 2 ? "bg-chart-4" : "bg-acid"),
                  )}
                />
              ))}
            </div>
            <span className="w-24 text-right font-mono text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground">
              {SCORE_LABELS[score]}
            </span>
          </div>
          <ul className="grid gap-1 text-xs">
            {checks.map((c) => (
              <li key={c.label} className={cn("flex items-center gap-1.5", c.ok ? "text-muted-foreground" : "text-destructive")}>
                {c.ok ? <Check className="size-3.5 text-acid-dim" aria-hidden /> : <X className="size-3.5" aria-hidden />}
                <span>
                  {c.label}
                  <span className="sr-only">{c.ok ? " — met" : " — not met"}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
