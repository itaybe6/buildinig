"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type CreateBusinessState,
  createBusinessAction,
} from "@/app/(dashboard)/super-admin/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      {pending ? "יוצר…" : "צור עסק"}
    </Button>
  );
}

const initialState: CreateBusinessState | undefined = undefined;

export function AddBusinessForm({
  title = "הוספת עסק חדש",
  description = "נוצר רשומת tenants ופרופיל עסק (business_profiles). לאחר מכן ניתן לשייך משתמש מנהל ל־tenant זה.",
  embedded = false,
  showHeader = !embedded,
  redirectTo,
}: {
  title?: string;
  description?: string;
  /** טופס בתוך מעטפת עמוד (ללא כרטיסיה חיצונית) */
  embedded?: boolean;
  showHeader?: boolean;
  /** לאחר יצירה מוצלחת — הפניה לנתיב במסגרת סופר־אדמין */
  redirectTo?: string;
}) {
  const [state, formAction] = useFormState(createBusinessAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  const formInner = (
    <form ref={formRef} action={formAction} className="grid gap-4">
      {redirectTo ? (
        <input type="hidden" name="redirect_to" value={redirectTo} />
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="biz-name">שם העסק (תצוגה)</Label>
        <Input
          id="biz-name"
          name="name"
          required
          placeholder="למשל: ניהול הבניין שלי"
          autoComplete="organization"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="biz-slug">מזהה slug (באנגלית)</Label>
        <Input
          id="biz-slug"
          name="slug"
          placeholder="אופציונלי — ייווצר אוטומטית מהשם אם ריק"
          dir="ltr"
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          ייחודי במערכת — משמש קישור וזיהוי טכני.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="biz-legal">שם משפטי / חברה (אופציונלי)</Label>
        <Input
          id="biz-legal"
          name="legal_name"
          placeholder="מופיע בפרופיל העסק"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="biz-email">אימייל יצירת קשר (אופציונלי)</Label>
        <Input
          id="biz-email"
          name="contact_email"
          type="email"
          placeholder="office@example.com"
          dir="ltr"
        />
      </div>

      {state?.ok === false ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state?.ok === true ? (
        <p className="text-sm text-green-700">העסק נוצר בהצלחה.</p>
      ) : null}

      <SubmitButton />
    </form>
  );

  if (embedded) {
    return (
      <div className="p-6 sm:p-8">
        {showHeader ? (
          <div className="mb-6 space-y-2">
            <h2 className="text-lg font-semibold leading-none">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        ) : null}
        {formInner}
      </div>
    );
  }

  return (
    <Card className="max-w-xl">
      {showHeader ? (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      ) : null}
      <CardContent>{formInner}</CardContent>
    </Card>
  );
}
