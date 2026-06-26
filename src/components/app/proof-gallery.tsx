"use client";

/* eslint-disable @next/next/no-img-element -- proofs are served from an /api route, not a static asset. */
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Proof } from "@/lib/api";

export function ProofGallery({ proofs }: { proofs: Proof[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const current = open != null ? proofs[open] : null;

  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {proofs.map((p, i) =>
          p.url ? (
            <button
              key={p.id}
              type="button"
              onClick={() => setOpen(i)}
              className="aspect-square overflow-hidden rounded-xl border border-border transition-transform active:scale-95"
            >
              <img src={p.url} alt={`Proof ${i + 1}`} className="size-full object-cover" loading="lazy" />
            </button>
          ) : (
            <div
              key={p.id}
              className="grid aspect-square place-items-center rounded-xl border border-border bg-muted text-2xl text-muted-foreground"
              title="Legacy proof (not viewable)"
            >
              📷
            </div>
          ),
        )}
      </div>

      {current?.url && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(null)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setOpen(null)}
          >
            <X className="size-5" />
          </button>
          <img
            src={current.url}
            alt="Proof"
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
