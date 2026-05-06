"use client";

import {
  type UpdateTenantBusinessState,
  updateTenantBusinessAction,
} from "@/app/(dashboard)/super-admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useFormState, useFormStatus } from "react-dom";
import { useCallback, useEffect, useState } from "react";

const inputClass =
  "h-11 rounded-xl border-border/60 bg-muted/30 px-3.5 text-[15px] md:text-sm";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-w-[120px]">
      {pending ? "שומר…" : "שמור"}
    </Button>
  );
}

const initialState: UpdateTenantBusinessState | undefined = undefined;

type Defaults = {
  contact_email: string | null;
  contact_phone: string | null;
  legal_name: string | null;
  tax_id: string | null;
  /** business_profiles.mobile_phone */
  business_mobile_phone: string | null;
  plan: string | null;
  is_active: boolean | null;
};

function EditTenantBusinessFields({
  tenantId,
  defaults,
  onSaved,
}: {
  tenantId: string;
  defaults: Defaults;
  onSaved: () => void;
}) {
  const [state, formAction] = useFormState(
    updateTenantBusinessAction,
    initialState
  );

  useEffect(() => {
    if (state?.ok) onSaved();
  }, [state, onSaved]);

  const active = defaults.is_active !== false;

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border bg-muted/20 p-4"
    >
      <input type="hidden" name="tenant_id" value={tenantId} />

      {state?.ok === false ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-green-700">הפרטים נשמרו בהצלחה.</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`ce-${tenantId}`}>אימייל</Label>
          <Input
            id={`ce-${tenantId}`}
            name="contact_email"
            type="email"
            defaultValue={defaults.contact_email ?? ""}
            className={cn(inputClass)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`ph-${tenantId}`}>טלפון</Label>
          <Input
            id={`ph-${tenantId}`}
            name="contact_phone"
            type="tel"
            defaultValue={defaults.contact_phone ?? ""}
            className={cn(inputClass)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`ln-${tenantId}`}>שם משפטי</Label>
          <Input
            id={`ln-${tenantId}`}
            name="legal_name"
            defaultValue={defaults.legal_name ?? ""}
            className={cn(inputClass)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`tx-${tenantId}`}>ח״פ / עוסק</Label>
          <Input
            id={`tx-${tenantId}`}
            name="tax_id"
            defaultValue={defaults.tax_id ?? ""}
            className={cn(inputClass)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`bmp-${tenantId}`}>פלאפון (פרופיל עסק)</Label>
          <Input
            id={`bmp-${tenantId}`}
            name="business_mobile_phone"
            type="tel"
            defaultValue={defaults.business_mobile_phone ?? ""}
            className={cn(inputClass)}
            dir="ltr"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`pl-${tenantId}`}>תוכנית</Label>
          <Input
            id={`pl-${tenantId}`}
            name="plan"
            defaultValue={defaults.plan ?? ""}
            className={cn(inputClass)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`ac-${tenantId}`}>פעיל</Label>
          <select
            id={`ac-${tenantId}`}
            name="is_active"
            defaultValue={active ? "true" : "false"}
            className={cn(
              inputClass,
              "w-full max-w-xs bg-background py-2 rtl:text-right"
            )}
          >
            <option value="true">כן</option>
            <option value="false">לא</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <SubmitButton />
        <Button type="button" variant="ghost" onClick={onSaved}>
          ביטול
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        שדה &quot;נוצר&quot; מוצג לקריאה בלבד ואינו ניתן לעריכה.
      </p>
    </form>
  );
}

export function EditTenantBusinessForm({
  tenantId,
  defaults,
}: {
  tenantId: string;
  defaults: Defaults;
}) {
  const [open, setOpen] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
          onClick={() =>
            setOpen((o) => {
              const next = !o;
              if (next) setFormVersion((v) => v + 1);
              return next;
            })
          }
        >
          {open ? "סגירה" : "עריכה"}
        </Button>
      </div>

      {open ? (
        <EditTenantBusinessFields
          key={formVersion}
          tenantId={tenantId}
          defaults={defaults}
          onSaved={handleClose}
        />
      ) : null}
    </div>
  );
}
