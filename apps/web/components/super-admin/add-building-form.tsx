"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SuperAdminAddBuildingForm({
  tenantId,
  collapsible = false,
  defaultExpanded = false,
}: {
  tenantId: string;
  /** כשאמת — הטופס מוסתר עד לחיצה על «הוספת בניין» */
  collapsible?: boolean;
  /** למשל אחרי יצירת עסק חדש — פותח את הטופס מיד */
  defaultExpanded?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(() =>
    collapsible ? defaultExpanded : true
  );
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [floors, setFloors] = useState("1");
  const [committeeFee, setCommitteeFee] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const floorsCount = Math.max(1, Number.parseInt(floors, 10) || 1);
    const feeRaw = committeeFee.trim().replace(",", ".");
    const feeNum = Number.parseFloat(feeRaw);
    if (committeeFee.trim() === "" || Number.isNaN(feeNum) || feeNum < 0) {
      setPending(false);
      setError("יש למלא דמי ועד בית (ש״ח, מספר חיובי או אפס).");
      return;
    }
    const supabase = createClient();
    const row = {
      business_profile_id: tenantId,
      address: address.trim(),
      city: city.trim(),
      floors_count: floorsCount,
      committee_fee: String(feeNum),
    };
    const { data: inserted, error: insertError } = await supabase
      .from("buildings")
      .insert(row)
      .select("id")
      .single();
    setPending(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    const newId = inserted?.id as string | undefined;
    setAddress("");
    setCity("");
    setFloors("1");
    setCommitteeFee("");
    if (collapsible) setOpen(false);
    if (newId) {
      router.push(`/super-admin/tenants/${tenantId}/buildings/${newId}`);
    } else {
      router.refresh();
    }
  }

  const form = (
    <form
      onSubmit={onSubmit}
      className="grid max-w-xl gap-4 rounded-lg border bg-card p-4"
    >
      <p className="font-medium">הוספת בניין ללקוח</p>
      <p className="text-sm text-muted-foreground">
        הזנת כתובת מלאה — אין שדה נפרד לשם בניין.
      </p>
      <div className="grid gap-2">
        <Label htmlFor="b-address">כתובת</Label>
        <Input
          id="b-address"
          required
          value={address}
          onChange={(ev) => setAddress(ev.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="b-city">עיר</Label>
        <Input
          id="b-city"
          required
          value={city}
          onChange={(ev) => setCity(ev.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="b-floors">מספר קומות</Label>
        <Input
          id="b-floors"
          inputMode="numeric"
          value={floors}
          onChange={(ev) => setFloors(ev.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="b-committee-fee">דמי ועד בית (₪ לחודש לדירה)</Label>
        <Input
          id="b-committee-fee"
          inputMode="decimal"
          required
          placeholder="למשל 350"
          value={committeeFee}
          onChange={(ev) => setCommitteeFee(ev.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "שומר…" : "הוסף בניין"}
        </Button>
        {collapsible ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            ביטול
          </Button>
        ) : null}
      </div>
    </form>
  );

  if (!collapsible) {
    return form;
  }

  return (
    <div className="space-y-3">
      {open ? (
        form
      ) : (
        <Button
          type="button"
          className="h-11 w-full sm:h-10 sm:w-auto"
          onClick={() => setOpen(true)}
        >
          הוספת בניין
        </Button>
      )}
    </div>
  );
}
