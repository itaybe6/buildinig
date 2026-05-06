"use client";

import {
  type ManagerBusinessActionState,
  type ManagerUserProfileActionState,
  updateManagerBusinessAction,
  updateManagerUserProfileAction,
} from "@/app/(dashboard)/(manager)/profile/actions";
import { BusinessLogoUpload } from "@/components/manager/business-logo-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import { cn } from "@/lib/utils";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

type BusinessDefaults = {
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  legal_name: string | null;
  tax_id: string | null;
  notes: string | null;
  /** אודות העסק — טקסט ציבורי */
  about: string | null;
  plan: string | null;
  is_active: boolean | null;
  created_at: string | null;
  id: string;
};

type ProfileDefaults = {
  full_name: string;
  /** פלאפון — נשמר ב-profiles.phone */
  phone: string | null;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-w-[120px]">
      {pending ? "שומר…" : label}
    </Button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function ManagerBusinessSection({
  tenantId,
  defaults,
}: {
  tenantId: string;
  defaults: BusinessDefaults;
}) {
  const [editing, setEditing] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [logoUrl, setLogoUrl] = useState(defaults.logo_url ?? "");

  useEffect(() => {
    setLogoUrl(defaults.logo_url ?? "");
  }, [defaults.logo_url]);

  useEffect(() => {
    if (!editing) {
      setLogoUrl(defaults.logo_url ?? "");
    }
  }, [editing, defaults.logo_url]);

  const openEdit = useCallback(() => {
    setLogoUrl(defaults.logo_url ?? "");
    setFormKey((k) => k + 1);
    setEditing(true);
  }, [defaults.logo_url]);

  const closeEdit = useCallback(() => setEditing(false), []);

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b bg-muted/20 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl">פרטי עסק</CardTitle>
          <CardDescription>
            פרטים מטבלת business_profiles — עריכה לפי צורך.
          </CardDescription>
        </div>
        {!editing ? (
          <Button type="button" variant="outline" size="sm" onClick={openEdit}>
            עריכה
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="pt-6">
        {!editing ? (
          <ManagerBusinessView defaults={defaults} />
        ) : (
          <ManagerBusinessEditForm
            key={formKey}
            tenantId={tenantId}
            defaults={defaults}
            logoUrl={logoUrl}
            onLogoUrlChange={setLogoUrl}
            onSaved={closeEdit}
            onCancel={closeEdit}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ManagerBusinessView({ defaults }: { defaults: BusinessDefaults }) {
  const src = defaults.logo_url?.trim();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-background shadow-inner">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              className="max-h-full max-w-full object-contain p-2"
            />
          ) : (
            <span className="px-3 text-center text-xs text-muted-foreground">
              ללא לוגו
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              {defaults.name}
            </h3>
            {defaults.legal_name ? (
              <p className="text-sm text-muted-foreground">{defaults.legal_name}</p>
            ) : null}
          </div>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <Field label="אימייל יצירת קשר">
              {defaults.contact_email ?? "—"}
            </Field>
            <Field label="טלפון">{defaults.contact_phone ?? "—"}</Field>
            <Field label="ח״פ / עוסק">{defaults.tax_id ?? "—"}</Field>
            <Field label="צבע ראשי">
              {defaults.primary_color ? (
                <span className="inline-flex items-center gap-2 font-mono text-xs">
                  <span
                    className="inline-block h-5 w-5 rounded border"
                    style={{ backgroundColor: defaults.primary_color }}
                  />
                  {defaults.primary_color}
                </span>
              ) : (
                "—"
              )}
            </Field>
          </div>
        </div>
      </div>

      {defaults.notes ? (
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground">הערות</p>
          <p className="mt-1 text-sm">{defaults.notes}</p>
        </div>
      ) : null}

      {defaults.about?.trim() ? (
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground">אודות העסק</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{defaults.about}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/15 p-4">
          <p className="text-xs font-medium text-muted-foreground">אודות העסק</p>
          <p className="mt-1 text-sm text-muted-foreground">לא הוגדר טקסט אודות.</p>
        </div>
      )}

      <div className="rounded-xl border border-dashed bg-muted/15 p-4 text-xs text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">תוכנית: </span>
          {defaults.plan ?? "—"}
        </p>
        <p className="mt-1">
          <span className="font-medium text-foreground">סטטוס: </span>
          {defaults.is_active !== false ? "פעיל" : "לא פעיל"}
        </p>
        <p className="mt-1 font-mono">מזהה: {defaults.id}</p>
        <p className="mt-2">
          נוצר:{" "}
          {defaults.created_at
            ? new Date(defaults.created_at).toLocaleString("he-IL")
            : "—"}
        </p>
        <p className="mt-3 text-[11px]">
          שינוי תוכנית או סטטוס פעילות — דרך מנהל-על בלבד.
        </p>
      </div>
    </div>
  );
}

function ManagerBusinessEditForm({
  tenantId,
  defaults,
  logoUrl,
  onLogoUrlChange,
  onSaved,
  onCancel,
}: {
  tenantId: string;
  defaults: BusinessDefaults;
  logoUrl: string;
  onLogoUrlChange: (url: string) => void;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [state, formAction] = useFormState<
    ManagerBusinessActionState | undefined,
    FormData
  >(updateManagerBusinessAction, undefined);

  useEffect(() => {
    if (state?.ok) onSaved();
  }, [state, onSaved]);

  return (
    <form action={formAction} className="grid gap-6">
      <input type="hidden" name="logo_url" value={logoUrl} />

      {state?.ok === false ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-green-700">נשמר בהצלחה.</p>
      ) : null}

      <BusinessLogoUpload
        tenantId={tenantId}
        logoUrl={logoUrl}
        onLogoUrlChange={onLogoUrlChange}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="bp-name">שם מוצג (עסק)</Label>
          <Input
            id="bp-name"
            name="name"
            required
            defaultValue={defaults.name}
            autoComplete="organization"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bp-legal">שם משפטי</Label>
          <Input
            id="bp-legal"
            name="legal_name"
            defaultValue={defaults.legal_name ?? ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bp-tax">ח״פ / עוסק מורשה</Label>
          <Input
            id="bp-tax"
            name="tax_id"
            defaultValue={defaults.tax_id ?? ""}
            dir="ltr"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bp-ce">אימייל יצירת קשר</Label>
          <Input
            id="bp-ce"
            name="contact_email"
            type="email"
            defaultValue={defaults.contact_email ?? ""}
            dir="ltr"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bp-cp">טלפון</Label>
          <Input
            id="bp-cp"
            name="contact_phone"
            type="tel"
            defaultValue={defaults.contact_phone ?? ""}
            dir="ltr"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bp-color">צבע ראשי (#hex)</Label>
          <Input
            id="bp-color"
            name="primary_color"
            defaultValue={defaults.primary_color ?? ""}
            placeholder="#2563eb"
            dir="ltr"
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="bp-notes">הערות פנימיות</Label>
          <Input
            id="bp-notes"
            name="notes"
            defaultValue={defaults.notes ?? ""}
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="bp-about">אודות העסק</Label>
          <textarea
            id="bp-about"
            name="about"
            rows={5}
            defaultValue={defaults.about ?? ""}
            placeholder="תיאור קצר של העסק — יוצג לדיירים כשיהיה רלוונטי בממשק."
            className={cn(
              "min-h-[120px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            )}
          />
          <p className="text-xs text-muted-foreground">
            שדה זה מיועד לתוכן ציבורי (לא הערות פנימיות).
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t pt-4">
        <SubmitButton label="שמור פרטי עסק" />
        <Button type="button" variant="ghost" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </form>
  );
}

function ManagerProfileView({ defaults }: { defaults: ProfileDefaults }) {
  return (
    <div className="grid gap-4 text-sm sm:grid-cols-2">
      <Field label="שם מלא">{defaults.full_name || "—"}</Field>
      <Field label="פלאפון">
        {defaults.phone?.trim() ? defaults.phone : "—"}
      </Field>
    </div>
  );
}

function ManagerAuthView({ email }: { email: string }) {
  const em = email.trim();
  return (
    <div className="space-y-3 text-sm">
      <Field label="אימייל כניסה">
        <span dir="ltr" className="inline-block font-mono text-xs">
          {em || "—"}
        </span>
      </Field>
      <p className="text-xs text-muted-foreground">
        לשינוי סיסמה או אימייל — היכנס למצב עריכה ובחר &quot;עדכן אימייל / סיסמה&quot;.
      </p>
    </div>
  );
}

function ManagerUserRowForm({ defaults }: { defaults: ProfileDefaults }) {
  const [state, formAction] = useFormState<
    ManagerUserProfileActionState | undefined,
    FormData
  >(updateManagerUserProfileAction, undefined);

  return (
    <form action={formAction} className="grid gap-4">
      {state?.ok === false ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-green-700">פרטי המשתמש נשמרו.</p>
      ) : null}

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="pf-name">שם מלא</Label>
          <Input
            id="pf-name"
            name="full_name"
            required
            defaultValue={defaults.full_name}
            autoComplete="name"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pf-phone">פלאפון</Label>
          <Input
            id="pf-phone"
            name="phone"
            type="tel"
            defaultValue={defaults.phone ?? ""}
            autoComplete="tel"
            dir="ltr"
          />
        </div>
      </div>

      <SubmitButton label="שמור פרטי פרופיל" />
    </form>
  );
}

function ManagerAccountSection({
  profile,
  authEmail,
}: {
  profile: ProfileDefaults;
  authEmail: string;
}) {
  const [editing, setEditing] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const openEdit = useCallback(() => {
    setFormKey((k) => k + 1);
    setEditing(true);
  }, []);

  const backToView = useCallback(() => {
    setEditing(false);
    setFormKey((k) => k + 1);
  }, []);

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b bg-muted/20 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl">פרטי משתמש</CardTitle>
          <CardDescription>
            שם ופלאפון בטבלת profiles. פרטי הכניסה מופיעים למטה.
          </CardDescription>
        </div>
        {!editing ? (
          <Button type="button" variant="outline" size="sm" onClick={openEdit}>
            עריכה
          </Button>
        ) : (
          <Button type="button" variant="secondary" size="sm" onClick={backToView}>
            חזרה לצפייה
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        {!editing ? (
          <>
            <ManagerProfileView defaults={profile} />
            <div className="mt-6 rounded-xl border bg-muted/25 p-4 shadow-inner">
              <p className="mb-3 text-sm font-medium">כניסה (אימייל וסיסמה)</p>
              <p className="mb-4 text-xs text-muted-foreground">
                עדכון חשבון Supabase — משפיע על ההתחברות לכל האפליקציות.
              </p>
              <ManagerAuthView email={authEmail} />
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">
                פרטי פרופיל
              </p>
              <ManagerUserRowForm key={`pf-${formKey}`} defaults={profile} />
            </div>
            <div className="rounded-xl border bg-muted/25 p-4 shadow-inner">
              <p className="mb-1 text-sm font-medium">כניסה (אימייל וסיסמה)</p>
              <p className="mb-4 text-xs text-muted-foreground">
                עדכון חשבון Supabase — משפיע על ההתחברות לכל האפליקציות.
              </p>
              <ManagerAuthSection initialEmail={authEmail} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ManagerAuthSection({
  initialEmail,
}: {
  initialEmail: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const onSaveAuth = useCallback(async () => {
    setErr(null);
    setMsg(null);

    const nextEmail = email.trim();
    const pwd = password.trim();
    const pwd2 = password2.trim();

    if (pwd || pwd2) {
      if (pwd.length < 6) {
        setErr("סיסמה חייבת להכיל לפחות 6 תווים.");
        return;
      }
      if (pwd !== pwd2) {
        setErr("הסיסמאות אינן תואמות.");
        return;
      }
    }

    const payload: { email?: string; password?: string } = {};
    if (nextEmail && nextEmail !== initialEmail) {
      payload.email = nextEmail;
    }
    if (pwd) {
      payload.password = pwd;
    }

    if (!payload.email && !payload.password) {
      setErr("לא שינית אימייל או סיסמה.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.updateUser(payload);
      if (error) {
        setErr(error.message);
        return;
      }
      setMsg(
        payload.email
          ? "העדכון נשלח. ייתכן שתתבקש לאשר את האימייל החדש."
          : "הסיסמה עודכנה."
      );
      setPassword("");
      setPassword2("");
    } finally {
      setBusy(false);
    }
  }, [email, initialEmail, password, password2]);

  return (
    <div className="grid gap-4">
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      {msg ? <p className="text-sm text-green-700">{msg}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="auth-email">אימייל כניסה</Label>
          <Input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            dir="ltr"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="auth-pw">סיסמה חדשה (אופציונלי)</Label>
          <Input
            id="auth-pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            dir="ltr"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="auth-pw2">אימות סיסמה</Label>
          <Input
            id="auth-pw2"
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            autoComplete="new-password"
            dir="ltr"
          />
        </div>
      </div>

      <Button type="button" onClick={() => void onSaveAuth()} disabled={busy}>
        {busy ? "שומר…" : "עדכן אימייל / סיסמה"}
      </Button>
      <p className="text-xs text-muted-foreground">
        שינוי אימייל וסיסמה מתבצע ב-Supabase Auth. ייתכן אישור במייל בהתאם
        להגדרות הפרויקט.
      </p>
    </div>
  );
}

export function ManagerProfileForms({
  tenantId,
  business,
  profile,
  authEmail,
}: {
  tenantId: string;
  business: BusinessDefaults;
  profile: ProfileDefaults;
  authEmail: string;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <ManagerAccountSection profile={profile} authEmail={authEmail} />
      <ManagerBusinessSection tenantId={tenantId} defaults={business} />
    </div>
  );
}
