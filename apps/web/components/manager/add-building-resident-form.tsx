"use client";

import { inviteResidentForBuildingAction } from "@/app/(dashboard)/(manager)/buildings/invite-resident-action";
import type { InviteResidentActionState } from "@/app/(dashboard)/(manager)/buildings/invite-resident-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormState } from "react-dom";

export function AddBuildingResidentForm({ buildingId }: { buildingId: string }) {
  const [state, formAction] = useFormState<
    InviteResidentActionState | undefined,
    FormData
  >(inviteResidentForBuildingAction, undefined);

  return (
    <form
      action={formAction}
      className="grid max-w-xl gap-4 rounded-lg border bg-card p-4"
    >
      <input type="hidden" name="building_id" value={buildingId} />
      <p className="font-medium">הוספת דייר לבניין</p>
      <p className="text-sm text-muted-foreground">
        נוצר משתמש עם תפקיד דייר, משויך לארגון ולבניין זה (
        <code className="rounded bg-muted px-1 text-xs">profiles.building_id</code>
        ).
      </p>
      <div className="grid gap-2">
        <Label htmlFor="full_name">שם מלא</Label>
        <Input id="full_name" name="full_name" required autoComplete="name" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">אימייל (כניסה)</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">סיסמה ראשונית</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">טלפון (אופציונלי)</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" />
      </div>
      {state && !state.ok ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-green-700">המשתמש נוצר בהצלחה.</p>
      ) : null}
      <Button type="submit">
        הוספת דייר
      </Button>
    </form>
  );
}
