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
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const floorsCount = Math.max(1, Number.parseInt(floors, 10) || 1);
    const supabase = createClient();
    const row = {
      business_profile_id: tenantId,
      address: address.trim(),
      city: city.trim(),
      floors_count: floorsCount,
    };
    const { error: insertError } = await supabase.from("buildings").insert(row);
    setPending(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setAddress("");
    setCity("");
    setFloors("1");
    router.refresh();
    if (collapsible) setOpen(false);
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
