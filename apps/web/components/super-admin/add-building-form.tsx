"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SuperAdminAddBuildingForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
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
      tenant_id: tenantId,
      name: name.trim(),
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
    setName("");
    setAddress("");
    setCity("");
    setFloors("1");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid max-w-xl gap-4 rounded-lg border bg-card p-4"
    >
      <p className="font-medium">הוספת בניין ללקוח</p>
      <div className="grid gap-2">
        <Label htmlFor="b-name">שם הבניין</Label>
        <Input
          id="b-name"
          required
          value={name}
          onChange={(ev) => setName(ev.target.value)}
        />
      </div>
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
      <Button type="submit" disabled={pending}>
        {pending ? "שומר…" : "הוסף בניין"}
      </Button>
    </form>
  );
}
