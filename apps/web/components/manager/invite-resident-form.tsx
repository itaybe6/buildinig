"use client";

import { inviteResidentForBuildingAction } from "@/app/(dashboard)/(manager)/buildings/invite-resident-action";
import type { InviteResidentActionState } from "@/app/(dashboard)/(manager)/buildings/invite-resident-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";

export type InviteResidentFormProps = {
  buildingId: string;
  /** Empty string = דייר לבניין בלי דירה ספציפית */
  unitId: string;
  /** קידומת ל-id של שדות (כשיש כמה טפסים בעמוד) */
  idPrefix?: string;
  variant?: "page" | "dialog";
  className?: string;
  formId?: string;
  onSuccess?: () => void;
};

export function InviteResidentForm({
  buildingId,
  unitId,
  idPrefix = "",
  variant = "page",
  className = "",
  formId,
  onSuccess,
}: InviteResidentFormProps) {
  const [state, formAction] = useFormState<
    InviteResidentActionState | undefined,
    FormData
  >(inviteResidentForBuildingAction, undefined);

  const successHandled = useRef(false);
  useEffect(() => {
    if (state?.ok) {
      if (!successHandled.current) {
        successHandled.current = true;
        onSuccess?.();
      }
    } else {
      successHandled.current = false;
    }
  }, [state, onSuccess]);

  const pid = (name: string) => (idPrefix ? `${idPrefix}-${name}` : name);

  const isDialog = variant === "dialog";
  const hasUnit = unitId.trim().length > 0;

  return (
    <form
      id={formId}
      action={formAction}
      className={
        className ||
        (isDialog
          ? "grid gap-3"
          : "grid max-w-xl gap-4 rounded-lg border bg-card p-4")
      }
    >
      <input type="hidden" name="building_id" value={buildingId} />
      <input type="hidden" name="unit_id" value={unitId} />

      {isDialog ? (
        hasUnit ? (
          <p className="text-sm text-muted-foreground">
            דייר חדש ישויך לדירה שנבחרה ולבניין זה.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            דייר חדש ישויך לבניין זה בלבד.
          </p>
        )
      ) : hasUnit ? (
        <>
          <p className="font-medium">הוספת דייר לבניין</p>
          <p className="text-sm text-muted-foreground">
            נוצר משתמש עם תפקיד דייר, משויך לארגון ולבניין זה (
            <code className="rounded bg-muted px-1 text-xs">
              profiles.building_id
            </code>
            ). הדייר ישויך גם לדירה שנבחרה (
            <code className="rounded bg-muted px-1 text-xs">
              profiles.unit_id
            </code>
            ).
          </p>
          <p className="rounded-md bg-muted/60 px-3 py-2 text-sm">
            מצב קישור דירה פעיל — לאחר יצירת המשתמש הוא ישויך לדירה שנבחרה.
          </p>
        </>
      ) : (
        <>
          <p className="font-medium">הוספת דייר לבניין (ללא דירה ספציפית)</p>
          <p className="text-sm text-muted-foreground">
            נוצר משתמש עם תפקיד דייר, משויך לארגון ולבניין זה. הדייר לא ישויך
            למספר דירה — ניתן לקשר אותו לדירה מאוחר יותר מטבלת הדירות.
          </p>
        </>
      )}

      <div className="grid gap-2">
        <Label htmlFor={pid("full_name")}>שם מלא</Label>
        <Input
          id={pid("full_name")}
          name="full_name"
          required
          autoComplete="name"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={pid("email")}>אימייל (כניסה)</Label>
        <Input
          id={pid("email")}
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={pid("password")}>סיסמה ראשונית</Label>
        <Input
          id={pid("password")}
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={pid("phone")}>טלפון (אופציונלי)</Label>
        <Input id={pid("phone")} name="phone" type="tel" autoComplete="tel" />
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
