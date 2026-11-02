import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Dial codes offered in the picker (India first). The API stores E.164: code + digits. */
const COUNTRIES = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1", flag: "🇺🇸", name: "US / Canada" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+977", flag: "🇳🇵", name: "Nepal" },
];
const DEFAULT_CODE = "+91";
const LONGEST_FIRST = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);

export type Phone = { code: string; national: string };

/** Split a stored number into dial code + national digits. Legacy numbers saved without a
 *  `+` are treated as Indian. */
export function splitPhone(stored: string | null | undefined): Phone {
  const s = (stored ?? "").replace(/[\s\-()]/g, "");
  if (!s) return { code: DEFAULT_CODE, national: "" };
  if (!s.startsWith("+")) return { code: DEFAULT_CODE, national: s.replace(/\D/g, "") };
  const known = LONGEST_FIRST.find((c) => s.startsWith(c.code));
  if (known) return { code: known.code, national: s.slice(known.code.length) };
  const m = s.match(/^(\+\d{1,3})(\d+)$/);
  return m?.[1] && m[2] ? { code: m[1], national: m[2] } : { code: DEFAULT_CODE, national: s.replace(/\D/g, "") };
}

/** E.164 for the API ("" when no digits). */
export const joinPhone = ({ code, national }: Phone) => (national ? code + national : "");

/** "+91 70148 43462" for display; other countries as "+code digits". */
export function formatPhone(stored: string | null | undefined) {
  const { code, national } = splitPhone(stored);
  if (!national) return "";
  if (code === "+91" && national.length === 10) return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
  return `${code} ${national}`;
}

/** Dial-code picker + digits-only number. Pasting a full "+91 …" number fills both. */
export function PhoneField({ value, onChange, autoFocus }: { value: Phone; onChange: (p: Phone) => void; autoFocus?: boolean }) {
  const options = COUNTRIES.some((c) => c.code === value.code)
    ? COUNTRIES
    : [...COUNTRIES, { code: value.code, flag: "🌐", name: "Other" }];

  function onNumber(raw: string) {
    if (raw.trim().startsWith("+")) return onChange(splitPhone(raw));
    onChange({ ...value, national: raw.replace(/\D/g, "").slice(0, 14) });
  }

  const box = "h-11 rounded-xl border border-input bg-card text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";
  return (
    <div className="flex gap-2">
      <div className="relative w-28 shrink-0">
        <select
          aria-label="Country code"
          value={value.code}
          onChange={(e) => onChange({ ...value, code: e.target.value })}
          className={cn(box, "w-full cursor-pointer appearance-none pl-3 pr-9")}
        >
          {options.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>
        {/* the native arrow is hidden (appearance-none) — draw the app's chevron instead */}
        <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        aria-label="Phone number"
        placeholder="70148 43462"
        autoFocus={autoFocus}
        value={value.national}
        onChange={(e) => onNumber(e.target.value)}
        className={cn(box, "min-w-0 flex-1 px-3 tabular-nums")}
      />
    </div>
  );
}
