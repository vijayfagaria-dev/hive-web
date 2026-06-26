"use client";

import { useRef, useState, type FormEvent } from "react";
import { ApiError, type Member, type Rule } from "@/lib/api";
import { useCreateComplaint } from "@/lib/queries";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const field =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

export function ReportForm({
  members,
  rulesByCategory,
}: {
  members: Member[];
  rulesByCategory: Record<string, Rule[]>;
}) {
  const report = useCreateComplaint();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  if (members.length === 0) {
    return <p className="text-muted-foreground">No one else here to report (yet).</p>;
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    if (photos.length === 0) {
      setMsg({ ok: false, text: "Add at least one photo as proof." });
      return;
    }
    report.mutate(
      { accusedId: Number(data.get("accusedId")), ruleId: Number(data.get("ruleId")), images: photos },
      {
        onSuccess: () => {
          setMsg({ ok: true, text: "Reported — the cooling window has started." });
          form.reset();
          setPhotos([]);
        },
        onError: (err) =>
          setMsg({ ok: false, text: err instanceof ApiError ? err.message : "Couldn't report that." }),
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <select name="accusedId" required defaultValue="" className={field}>
        <option value="" disabled>
          Who did it?
        </option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <select name="ruleId" required defaultValue="" className={field}>
        <option value="" disabled>
          What did they do?
        </option>
        {Object.entries(rulesByCategory).map(([cat, rules]) => (
          <optgroup key={cat} label={cat}>
            {rules.map((r) => (
              <option key={r.id} value={r.id}>
                {r.text} (₹{r.amount})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 justify-start rounded-lg")}
      >
        📸 {photos.length ? `${photos.length} photo${photos.length > 1 ? "s" : ""} attached` : "Add photo proof (required)"}
      </button>
      <button
        type="submit"
        disabled={report.isPending || photos.length === 0}
        className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-lg")}
      >
        {report.isPending ? "Filing…" : "Report it"}
      </button>
      {msg && (
        <p className={cn("text-sm", msg.ok ? "text-primary" : "text-destructive")}>{msg.text}</p>
      )}
    </form>
  );
}
