import type { Member } from "@/lib/api";
import { Avatar } from "./avatar";
import { cn } from "@/lib/utils";

/** Avatar grid — caller passes members already filtered (e.g. excluding self). */
export function MemberPicker({
  members,
  value,
  onChange,
}: {
  members: Member[];
  value: number | null;
  onChange: (id: number) => void;
}) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">No one else here to accuse (yet).</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {members.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-2xl border p-3 transition-colors",
            value === m.id ? "border-acid bg-primary/10" : "border-border hover:border-acid/40",
          )}
        >
          <Avatar name={m.name} className="size-12" />
          <span className="w-full truncate text-center text-sm font-medium">{m.name}</span>
        </button>
      ))}
    </div>
  );
}
