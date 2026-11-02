"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { useSetWhatsapp } from "@/lib/queries";
import { Sheet } from "@/components/app/sheet";
import { joinPhone, PhoneField, splitPhone } from "./phone-field";

/** WhatsApp number: pick the country, type the digits — the API gets E.164.
 *  Mount it only while open, so each opening starts from the saved number. */
export function WhatsappSheet({
  open,
  onClose,
  current,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  current: string | null;
  onDone: (msg: string) => void;
}) {
  const setWhatsapp = useSetWhatsapp();
  const [phone, setPhone] = useState(() => splitPhone(current));
  const [error, setError] = useState<string | null>(null);

  const digits = phone.national.length;
  const valid = digits === 0 || (digits >= 6 && digits <= 14);
  const changed = joinPhone(phone) !== joinPhone(splitPhone(current));

  async function save() {
    setError(null);
    try {
      await setWhatsapp.mutateAsync(joinPhone(phone) || null);
      onDone(digits ? "WhatsApp number saved" : "WhatsApp number removed");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your number.");
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="WhatsApp">
      <p className="text-sm text-muted-foreground">Hive messages you here when someone reports you or a vote needs you.</p>
      <div className="mt-4">
        <PhoneField value={phone} onChange={setPhone} autoFocus />
      </div>
      {!valid && <p className="mt-2 text-sm text-destructive">Enter the number without the country code — 6 to 14 digits.</p>}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={setWhatsapp.isPending || !valid || !changed}
        className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {setWhatsapp.isPending ? "Saving…" : digits ? "Save number" : "Remove number"}
      </button>
    </Sheet>
  );
}
