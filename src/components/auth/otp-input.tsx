"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

const LENGTH = 6;

/** Six single-digit boxes: auto-advance, backspace-to-previous, arrow keys, paste
 *  the whole code anywhere, and SMS/email autofill via `one-time-code`. Calls
 *  `onComplete` once all six digits are in. */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
  autoFocus = true,
}: {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");

  function commit(next: string, focusIndex: number) {
    const code = next.replace(/\D/g, "").slice(0, LENGTH);
    onChange(code);
    refs.current[Math.min(focusIndex, LENGTH - 1)]?.focus();
    if (code.length === LENGTH) onComplete?.(code);
  }

  function onInput(i: number, raw: string) {
    const typed = raw.replace(/\D/g, "");
    if (!typed) return;
    // Autofill / fast typing can drop several digits into one box.
    const next = (value.slice(0, i) + typed + value.slice(i + typed.length)).slice(0, LENGTH);
    commit(next, i + typed.length);
  }

  function onKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) commit(value.slice(0, i) + value.slice(i + 1), i);
      else if (i > 0) commit(value.slice(0, i - 1) + value.slice(i), i - 1);
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < LENGTH - 1) {
      refs.current[i + 1]?.focus();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    e.preventDefault();
    commit(pasted, pasted.length);
  }

  return (
    <div
      role="group"
      aria-label="6-digit verification code"
      className={cn("flex justify-between gap-2", invalid && "animate-[otp-shake_0.36s_ease-in-out]")}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={LENGTH}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid || undefined}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          value={d}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-14 w-full min-w-0 rounded-xl border border-input bg-card text-center font-mono text-2xl font-semibold tabular-nums outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50",
            d && "border-foreground/30",
            invalid && "border-destructive ring-3 ring-destructive/15",
          )}
        />
      ))}
    </div>
  );
}
