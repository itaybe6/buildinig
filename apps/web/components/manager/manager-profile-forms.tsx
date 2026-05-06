"use client";

import {
  type ManagerBusinessActionState,
  type ManagerUserProfileActionState,
  updateManagerBusinessAction,
  updateManagerUserProfileAction,
} from "@/app/(dashboard)/(manager)/profile/actions";
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
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
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
  mobile_phone: string | null;
  notes: string | null;
  plan: string | null;
  is_active: boolean | null;
  created_at: string | null;
  id: string;
};

type ProfileDefaults = {
  full_name: string;
  phone: string | null;
  mobile_phone: string | null;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-w-[120px]">
      {pending ? "שומר…" : label}
    </Button>
  );
}

function ManagerBusinessForm({
  defaults,
}: {
  defaults: BusinessDefaults;
}) {
  const [state, formAction] = useFormState<
    ManagerBusinessActionState | undefined,
    FormData
  >(updateManagerBusinessAction, undefined);

  return (
    <form action={formAction} className="grid gap-4">
      {state?.ok === false ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-green-700">פרטי העסק נשמרו.</p>
      ) : null}

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
          <Label htmlFor="bp-cp">טלפון קווי</Label>
          <Input
            id="bp-cp"
            name="contact_phone"
            type="tel"
            defaultValue={defaults.contact_phone ?? ""}
            dir="ltr"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bp-mobile">פלאפון (עסק)</Label>
          <Input
            id="bp-mobile"
            name="business_mobile_phone"
            type="tel"
            defaultValue={defaults.mobile_phone ?? ""}
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
          <Label htmlFor="bp-logo">כתובת לוגו (URL)</Label>
          <Input
            id="bp-logo"
            name="logo_url"
            type="url"
            defaultValue={defaults.logo_url ?? ""}
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
      </div>

      <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">תוכנית: </span>
          {defaults.plan ?? "—"}
        </p>
        <p>
          <span className="font-medium text-foreground">סטטוס פעילות: </span>
          {defaults.is_active !== false ? "פעיל" : "לא פעיל"}
        </p>
        <p className="font-mono text-xs">
          מזהה עסק: {defaults.id}
        </p>
        <p className="text-xs">
          נוצר:{" "}
          {defaults.created_at
            ? new Date(defaults.created_at).toLocaleString("he-IL")
            : "—"}
        </p>
        <p className="mt-2 text-xs">
          שינוי תוכנית או סטטוס פעילות מתבצע דרך מנהל-על בלבד.
        </p>
      </div>

      <SubmitButton label="שמור פרטי עסק" />
    </form>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
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
          <Label htmlFor="pf-phone">טלפון</Label>
          <Input
            id="pf-phone"
            name="phone"
            type="tel"
            defaultValue={defaults.phone ?? ""}
            autoComplete="tel"
            dir="ltr"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pf-mobile">פלאפון</Label>
          <Input
            id="pf-mobile"
            name="mobile_phone"
            type="tel"
            defaultValue={defaults.mobile_phone ?? ""}
            autoComplete="tel"
            dir="ltr"
          />
        </div>
      </div>

      <SubmitButton label="שמור פרטי פרופיל" />
    </form>
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
  business,
  profile,
  authEmail,
}: {
  business: BusinessDefaults;
  profile: ProfileDefaults;
  authEmail: string;
}) {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>פרטי עסק</CardTitle>
          <CardDescription>
            נשמרים בטבלת business_profiles עבור הארגון שלך.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManagerBusinessForm defaults={business} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>פרטי משתמש (פרופיל)</CardTitle>
          <CardDescription>
            נשמרים בטבלת profiles — שם וטלפונים.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManagerUserRowForm defaults={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>כניסה (אימייל וסיסמה)</CardTitle>
          <CardDescription>
            עדכון חשבון Supabase — משפיע על ההתחברות לכל האפליקציות.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManagerAuthSection initialEmail={authEmail} />
        </CardContent>
      </Card>
    </div>
  );
}
