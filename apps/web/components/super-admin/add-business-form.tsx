"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type CreateBusinessState,
  createBusinessAction,
} from "@/app/(dashboard)/super-admin/actions";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";

const inputPremium =
  "h-11 rounded-xl border-border/60 bg-muted/30 px-3.5 text-[15px] shadow-inner shadow-black/[0.02] transition-all placeholder:text-muted-foreground/65 focus-visible:border-primary/45 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/15 md:text-sm";

function SubmitButton({
  appearance = "default",
  afterCreate,
}: {
  appearance?: "default" | "premium";
  /** יעד אחרי יצירה (משפיע על טקסט הכפתור במצב premium) */
  afterCreate?: "list" | "buildings";
}) {
  const { pending } = useFormStatus();
  const isPremium = appearance === "premium";
  const primaryLabel =
    isPremium && afterCreate === "buildings"
      ? "צור לקוח והמשך לבניינים"
      : isPremium
        ? "צור לקוח חדש"
        : "צור עסק";
  return (
    <Button
      type="submit"
      size={isPremium ? "lg" : "default"}
      className={cn(
        isPremium
          ? "h-12 w-full rounded-xl text-[15px] font-semibold shadow-lg shadow-primary/20 transition hover:bg-primary/95 hover:shadow-xl hover:shadow-primary/25"
          : "w-full sm:w-auto"
      )}
      disabled={pending}
    >
      {pending ? "יוצר…" : primaryLabel}
    </Button>
  );
}

const initialState: CreateBusinessState | undefined = undefined;

export function AddBusinessForm({
  title = "הוספת עסק חדש",
  description = "נוצר עסק, פרופיל עסק, וחשבון מנהל (משתמש Auth + רשומת profiles).",
  embedded = false,
  showHeader = !embedded,
  redirectTo,
  appearance = "default",
  /** לאחר יצירה: רשימת לקוחות, או המשך לעמוד בניינים של העסק החדש */
  afterCreate = "list",
}: {
  title?: string;
  description?: string;
  /** טופס בתוך מעטפת עמוד (ללא כרטיסיה חיצונית) */
  embedded?: boolean;
  showHeader?: boolean;
  /** לאחר יצירה מוצלחת — הפניה לנתיב במסגרת סופר־אדמין (לא בשימוש יחד עם afterCreate=buildings) */
  redirectTo?: string;
  /** עיצוב מורחב לעמוד ייעודי (מצב embedded) */
  appearance?: "default" | "premium";
  afterCreate?: "list" | "buildings";
}) {
  const [state, formAction] = useFormState(createBusinessAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  const premiumVisual = embedded && appearance === "premium";
  const labelCls = premiumVisual
    ? "text-[13px] font-semibold text-foreground/90"
    : undefined;

  const formInner = (
    <form
      ref={formRef}
      action={formAction}
      className={cn("grid", premiumVisual ? "gap-8" : "gap-4")}
    >
      {afterCreate === "buildings" ? (
        <input type="hidden" name="next_step" value="buildings" />
      ) : null}
      {redirectTo && afterCreate !== "buildings" ? (
        <input type="hidden" name="redirect_to" value={redirectTo} />
      ) : null}

      {premiumVisual ? (
        <>
          <section className="space-y-5 rounded-2xl border border-border/50 bg-gradient-to-br from-muted/50 via-muted/25 to-background p-5 shadow-inner sm:p-6">
            <header className="border-b border-border/45 pb-4">
              <h3 className="text-base font-semibold tracking-tight">
                פרטי העסק
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                השם יוצג למנהלים ולדיירים בממשק.
              </p>
            </header>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="biz-name" className={labelCls}>
                  שם העסק (תצוגה)
                </Label>
                <Input
                  id="biz-name"
                  name="name"
                  required
                  placeholder="למשל: ניהול הבניין שלי"
                  autoComplete="organization"
                  className={inputPremium}
                />
              </div>
            </div>
          </section>

          <section className="space-y-5 rounded-2xl border border-dashed border-border/55 bg-muted/15 p-5 sm:p-6">
            <header className="pb-1">
              <h3 className="text-base font-semibold tracking-tight">
                פרטים נוספים
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                אופציונלי — ניתן למלא בהמשך מהגדרות העסק.
              </p>
            </header>
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
              <div className="grid gap-2 sm:col-span-1">
                <Label htmlFor="biz-legal" className={labelCls}>
                  שם משפטי / חברה
                </Label>
                <Input
                  id="biz-legal"
                  name="legal_name"
                  placeholder="מופיע בפרופיל העסק"
                  className={inputPremium}
                />
              </div>
              <div className="grid gap-2 sm:col-span-1">
                <Label htmlFor="biz-email" className={labelCls}>
                  אימייל יצירת קשר
                </Label>
                <Input
                  id="biz-email"
                  name="contact_email"
                  type="email"
                  placeholder="office@example.com"
                  dir="ltr"
                  className={inputPremium}
                />
              </div>
            </div>
          </section>

          <section className="space-y-5 rounded-2xl border border-primary/25 bg-primary/[0.05] p-5 shadow-inner sm:p-6">
            <header className="border-b border-primary/15 pb-4">
              <h3 className="text-base font-semibold tracking-tight">
                מנהל העסק (כניסה למערכת)
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                נוצר חשבון התחברות ופרופיל עם תפקיד מנהל, משויך לעסק החדש.
              </p>
            </header>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="mgr-name" className={labelCls}>
                  שם מלא — מנהל
                </Label>
                <Input
                  id="mgr-name"
                  name="manager_full_name"
                  required
                  autoComplete="name"
                  placeholder="למשל: יוסי כהן"
                  className={inputPremium}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="mgr-email" className={labelCls}>
                    אימייל להתחברות
                  </Label>
                  <Input
                    id="mgr-email"
                    name="manager_email"
                    type="email"
                    required
                    dir="ltr"
                    autoComplete="email"
                    placeholder="manager@example.com"
                    className={inputPremium}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mgr-phone" className={labelCls}>
                    טלפון (אופציונלי)
                  </Label>
                  <Input
                    id="mgr-phone"
                    name="manager_phone"
                    type="tel"
                    dir="ltr"
                    autoComplete="tel"
                    placeholder="050-0000000"
                    className={inputPremium}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mgr-password" className={labelCls}>
                  סיסמה ראשונית למנהל
                </Label>
                <Input
                  id="mgr-password"
                  name="manager_password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  dir="ltr"
                  placeholder="לפחות 6 תווים"
                  className={inputPremium}
                />
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
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

          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="mb-4 text-sm font-semibold">מנהל העסק (כניסה למערכת)</p>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="mgr-name-d">שם מלא — מנהל</Label>
                <Input
                  id="mgr-name-d"
                  name="manager_full_name"
                  required
                  autoComplete="name"
                  placeholder="שם המנהל"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="mgr-email-d">אימייל להתחברות</Label>
                  <Input
                    id="mgr-email-d"
                    name="manager_email"
                    type="email"
                    required
                    dir="ltr"
                    autoComplete="email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mgr-phone-d">טלפון (אופציונלי)</Label>
                  <Input
                    id="mgr-phone-d"
                    name="manager_phone"
                    type="tel"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mgr-password-d">סיסמה ראשונית למנהל</Label>
                <Input
                  id="mgr-password-d"
                  name="manager_password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  dir="ltr"
                  placeholder="לפחות 6 תווים"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {state?.ok === false ? (
        <p
          className={cn(
            "text-sm text-destructive",
            premiumVisual &&
              "rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3"
          )}
        >
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p className="text-sm text-green-700">העסק נוצר בהצלחה.</p>
      ) : null}

      <SubmitButton
        appearance={premiumVisual ? "premium" : "default"}
        afterCreate={afterCreate}
      />
    </form>
  );

  if (embedded) {
    return (
      <div
        className={cn(
          premiumVisual ? "p-6 sm:p-9 lg:p-10" : "p-6 sm:p-8"
        )}
      >
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
