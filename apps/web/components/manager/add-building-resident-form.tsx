"use client";

import { inviteResidentForBuildingAction } from "@/app/(dashboard)/(manager)/buildings/invite-resident-action";
import type { InviteResidentActionState } from "@/app/(dashboard)/(manager)/buildings/invite-resident-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useFormState } from "react-dom";

function AddBuildingResidentFormInner({
  buildingId,
}: {
  buildingId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitFromQuery = searchParams.get("resident_unit")?.trim() ?? "";

  const [state, formAction] = useFormState<
    InviteResidentActionState | undefined,
    FormData
  >(inviteResidentForBuildingAction, undefined);

  useEffect(() => {
    if (state?.ok && unitFromQuery) {
      router.replace(`/buildings/${buildingId}`);
    }
  }, [state?.ok, unitFromQuery, buildingId, router]);

  return (
    <form
      id="add-resident-form"
      action={formAction}
      className="grid max-w-xl gap-4 rounded-lg border bg-card p-4"
    >
      <input type="hidden" name="building_id" value={buildingId} />
      <input type="hidden" name="unit_id" value={unitFromQuery} />
      <p className="font-medium">הוספת דייר לבניין</p>
      <p className="text-sm text-muted-foreground">
        נוצר משתמש עם תפקיד דייר, משויך לארגון ולבניין זה (
        <code className="rounded bg-muted px-1 text-xs">profiles.building_id</code>
        ).
        {unitFromQuery ? (
          <>
            {" "}
            הדייר ישויך גם לדירה שנבחרה (
            <code className="rounded bg-muted px-1 text-xs">
              profiles.unit_id
            </code>
            ).
          </>
        ) : null}
      </p>
      {unitFromQuery ? (
        <p className="rounded-md bg-muted/60 px-3 py-2 text-sm">
          מצב קישור דירה פעיל — לאחר יצירת המשתמש הוא ישויך לדירה שנבחרה.
        </p>
      ) : null}
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
      <Button type="submit">הוספת דייר</Button>
    </form>
  );
}

export function AddBuildingResidentForm({
  buildingId,
}: {
  buildingId: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          טוען טופס…
        </div>
      }
    >
      <AddBuildingResidentFormInner buildingId={buildingId} />
    </Suspense>
  );
}
