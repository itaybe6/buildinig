"use client";

import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  cn,
} from "@my-project/ui-web";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type PaymentSettingsBuildingOption = {
  id: string;
  label: string;
};

const TEXTAREA_CLASS =
  "flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

const READONLY_BOX =
  "rounded-md border border-transparent bg-muted/40 px-3 py-2 text-sm";

const DEFAULTS = {
  collection_day: 1,
  reminder_days_before: 3,
  reminder_message_template: "",
  unpaid_alert_enabled: true,
  unpaid_alert_days_after: 7,
  bank_name: "",
  bank_branch: "",
  bank_account_number: "",
  bank_account_owner: "",
};

function applyRowToState(row: {
  collection_day: number;
  reminder_days_before: number;
  reminder_message_template: string | null;
  unpaid_alert_enabled: boolean;
  unpaid_alert_days_after: number | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_account_number: string | null;
  bank_account_owner: string | null;
}) {
  return {
    collection_day: row.collection_day,
    reminder_days_before: row.reminder_days_before,
    reminder_message_template: row.reminder_message_template ?? "",
    unpaid_alert_enabled: row.unpaid_alert_enabled,
    unpaid_alert_days_after:
      row.unpaid_alert_days_after ?? DEFAULTS.unpaid_alert_days_after,
    bank_name: row.bank_name ?? "",
    bank_branch: row.bank_branch ?? "",
    bank_account_number: row.bank_account_number ?? "",
    bank_account_owner: row.bank_account_owner ?? "",
  };
}

function displayOrDash(value: string) {
  const t = value.trim();
  return t.length ? t : "—";
}

export function ManagerPaymentSettingsForm({
  buildings,
}: {
  buildings: PaymentSettingsBuildingOption[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [buildingId, setBuildingId] = useState(buildings[0]?.id ?? "");
  const [loadingRow, setLoadingRow] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsExist, setSettingsExist] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [collectionDay, setCollectionDay] = useState(DEFAULTS.collection_day);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(
    DEFAULTS.reminder_days_before
  );
  const [reminderTemplate, setReminderTemplate] = useState(
    DEFAULTS.reminder_message_template
  );
  const [unpaidAlertEnabled, setUnpaidAlertEnabled] = useState(
    DEFAULTS.unpaid_alert_enabled
  );
  const [unpaidAlertDaysAfter, setUnpaidAlertDaysAfter] = useState(
    DEFAULTS.unpaid_alert_days_after
  );
  const [bankName, setBankName] = useState(DEFAULTS.bank_name);
  const [bankBranch, setBankBranch] = useState(DEFAULTS.bank_branch);
  const [bankAccountNumber, setBankAccountNumber] = useState(
    DEFAULTS.bank_account_number
  );
  const [bankAccountOwner, setBankAccountOwner] = useState(
    DEFAULTS.bank_account_owner
  );

  const loadSettings = useCallback(
    async (bid: string): Promise<void> => {
      if (!bid) return;
      setLoadingRow(true);
      setBanner(null);
      const { data, error } = await supabase
        .from("payment_settings")
        .select(
          "collection_day, reminder_days_before, reminder_message_template, unpaid_alert_enabled, unpaid_alert_days_after, bank_name, bank_branch, bank_account_number, bank_account_owner"
        )
        .eq("building_id", bid)
        .maybeSingle();

      if (error) {
        setBanner({ type: "error", message: error.message });
        setSettingsExist(false);
        setLoadingRow(false);
        return;
      }

      setSettingsExist(!!data);

      if (data) {
        const s = applyRowToState(data);
        setCollectionDay(s.collection_day);
        setReminderDaysBefore(s.reminder_days_before);
        setReminderTemplate(s.reminder_message_template);
        setUnpaidAlertEnabled(s.unpaid_alert_enabled);
        setUnpaidAlertDaysAfter(s.unpaid_alert_days_after);
        setBankName(s.bank_name);
        setBankBranch(s.bank_branch);
        setBankAccountNumber(s.bank_account_number);
        setBankAccountOwner(s.bank_account_owner);
      } else {
        setCollectionDay(DEFAULTS.collection_day);
        setReminderDaysBefore(DEFAULTS.reminder_days_before);
        setReminderTemplate(DEFAULTS.reminder_message_template);
        setUnpaidAlertEnabled(DEFAULTS.unpaid_alert_enabled);
        setUnpaidAlertDaysAfter(DEFAULTS.unpaid_alert_days_after);
        setBankName(DEFAULTS.bank_name);
        setBankBranch(DEFAULTS.bank_branch);
        setBankAccountNumber(DEFAULTS.bank_account_number);
        setBankAccountOwner(DEFAULTS.bank_account_owner);
      }
      setLoadingRow(false);
    },
    [supabase]
  );

  useEffect(() => {
    if (buildingId) void loadSettings(buildingId);
  }, [buildingId, loadSettings]);

  useEffect(() => {
    setIsEditing(false);
  }, [buildingId]);

  useEffect(() => {
    return () => {
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
  }, []);

  function showBanner(type: "success" | "error", message: string) {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setBanner({ type, message });
    bannerTimer.current = setTimeout(() => setBanner(null), 4500);
  }

  async function handleCancelEdit() {
    await loadSettings(buildingId);
    setIsEditing(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!buildingId) return;

    const day = Number(collectionDay);
    const before = Number(reminderDaysBefore);
    const after = Number(unpaidAlertDaysAfter);

    if (!Number.isInteger(day) || day < 1 || day > 28) {
      showBanner("error", "יום הגביה חייב להיות בין 1 ל־28.");
      return;
    }
    if (!Number.isInteger(before) || before < 0) {
      showBanner("error", "ימים לפני תזכורת חייבים להיות מספר שלם חיובי או אפס.");
      return;
    }
    if (unpaidAlertEnabled) {
      if (!Number.isInteger(after) || after < 0) {
        showBanner(
          "error",
          "ימים אחרי הגביה להתראה חייבים להיות מספר שלם חיובי או אפס."
        );
        return;
      }
    }

    setSaving(true);
    setBanner(null);

    const payload = {
      building_id: buildingId,
      collection_day: day,
      reminder_days_before: before,
      reminder_message_template: reminderTemplate.trim() || null,
      unpaid_alert_enabled: unpaidAlertEnabled,
      unpaid_alert_days_after: unpaidAlertEnabled ? after : null,
      bank_name: bankName.trim() || null,
      bank_branch: bankBranch.trim() || null,
      bank_account_number: bankAccountNumber.trim() || null,
      bank_account_owner: bankAccountOwner.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("payment_settings").upsert(payload, {
      onConflict: "building_id",
    });

    setSaving(false);

    if (error) {
      showBanner("error", error.message);
      return;
    }
    showBanner("success", "ההגדרות נשמרו בהצלחה.");
    setSettingsExist(true);
    setIsEditing(false);
    await loadSettings(buildingId);
  }

  const collectionDayOptions = Array.from({ length: 28 }, (_, i) => i + 1);

  const buildingSelectDisabled = loadingRow || saving || isEditing;

  return (
    <div className="space-y-6" dir="rtl">
      {banner ? (
        <div
          role="status"
          className={cn(
            "rounded-md border px-4 py-3 text-sm",
            banner.type === "success"
              ? "border-emerald-600/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
              : "border-destructive/50 bg-destructive/10 text-destructive"
          )}
        >
          {banner.message}
        </div>
      ) : null}

      {buildings.length > 1 ? (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">בניין</CardTitle>
            <CardDescription>בחרו את הבניין שעבורו מציגים או מעדכנים הגדרות.</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="building-select" className="sr-only">
              בניין
            </Label>
            <select
              id="building-select"
              className={cn(
                "flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              )}
              value={buildingId}
              onChange={(ev) => setBuildingId(ev.target.value)}
              disabled={buildingSelectDisabled}
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      ) : null}

      {loadingRow ? (
        <p className="text-sm text-muted-foreground">טוען הגדרות…</p>
      ) : !isEditing ? (
        <div className="space-y-6">
          {!settingsExist ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">עדיין לא הוגדר</CardTitle>
                <CardDescription>
                  לא נשמרו הגדרות תשלום לבניין שנבחר. ניתן להגדיר אותן כעת.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" onClick={() => setIsEditing(true)}>
                  הגדר עכשיו
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  סקירת ההגדרות השמורות. לשינוי לחצו על «עריכה».
                </p>
                <Button type="button" onClick={() => setIsEditing(true)}>
                  עריכה
                </Button>
              </div>

              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">הגדרות גביה</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">יום גביה בחודש</p>
                    <p className={READONLY_BOX}>{collectionDay}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      ימים לפני הגביה — תזכורת
                    </p>
                    <p className={READONLY_BOX}>{reminderDaysBefore}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">תבנית הודעת תזכורת</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={cn(
                      READONLY_BOX,
                      "min-h-[80px] whitespace-pre-wrap"
                    )}
                  >
                    {displayOrDash(reminderTemplate)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">התראה על אי־תשלום</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">סטטוס</p>
                    <p className={READONLY_BOX}>
                      {unpaidAlertEnabled ? "מופעל" : "כבוי"}
                    </p>
                  </div>
                  {unpaidAlertEnabled ? (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        ימים אחרי יום הגביה לשליחת ההתראה
                      </p>
                      <p className={READONLY_BOX}>{unpaidAlertDaysAfter}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">פרטי חשבון בנק</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">שם הבנק</p>
                    <p className={READONLY_BOX}>{displayOrDash(bankName)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">מספר סניף</p>
                    <p className={READONLY_BOX}>{displayOrDash(bankBranch)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">מספר חשבון</p>
                    <p className={READONLY_BOX}>
                      {displayOrDash(bankAccountNumber)}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">
                      שם בעל החשבון
                    </p>
                    <p className={READONLY_BOX}>
                      {displayOrDash(bankAccountOwner)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      ) : (
        <form className="space-y-6" onSubmit={onSubmit}>
          <fieldset
            disabled={loadingRow || saving}
            className="space-y-6 disabled:opacity-60"
          >
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">הגדרות גביה</CardTitle>
                <CardDescription>
                  מתי מתבצעת הגביה ומתי לשלוח תזכורת לדיירים.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="collection_day">יום גביה בחודש</Label>
                  <select
                    id="collection_day"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={String(collectionDay)}
                    onChange={(ev) => setCollectionDay(Number(ev.target.value))}
                  >
                    {collectionDayOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminder_days_before">
                    ימים לפני הגביה — תזכורת
                  </Label>
                  <Input
                    id="reminder_days_before"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={String(reminderDaysBefore)}
                    onChange={(e) =>
                      setReminderDaysBefore(
                        Number.parseInt(e.target.value, 10) || 0
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">תבנית הודעת תזכורת</CardTitle>
                <CardDescription>
                  ניתן להשתמש במשתנים בתוך הטקסט (החלפה אוטומטית בשליחה).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  id="reminder_message_template"
                  className={TEXTAREA_CLASS}
                  value={reminderTemplate}
                  onChange={(e) => setReminderTemplate(e.target.value)}
                  placeholder="לדוגמה: שלום {{tenant_name}}, תזכורת לתשלום..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  משתנים זמינים:{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                    {`{{tenant_name}}`}
                  </code>
                  ,{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                    {`{{amount}}`}
                  </code>
                  ,{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                    {`{{collection_date}}`}
                  </code>
                  ,{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                    {`{{building_name}}`}
                  </code>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">התראה על אי־תשלום</CardTitle>
                <CardDescription>
                  שליחת התראה למנהל על דיירים שלא שילמו לאחר מועד הגביה.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input accent-primary"
                    checked={unpaidAlertEnabled}
                    onChange={(e) => setUnpaidAlertEnabled(e.target.checked)}
                  />
                  <span className="text-sm font-medium leading-none">
                    להפעיל התראה למנהל
                  </span>
                </label>
                {unpaidAlertEnabled ? (
                  <div className="space-y-2 sm:max-w-xs">
                    <Label htmlFor="unpaid_alert_days_after">
                      ימים אחרי יום הגביה לשליחת ההתראה
                    </Label>
                    <Input
                      id="unpaid_alert_days_after"
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={String(unpaidAlertDaysAfter)}
                      onChange={(e) =>
                        setUnpaidAlertDaysAfter(
                          Number.parseInt(e.target.value, 10) || 0
                        )
                      }
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">פרטי חשבון בנק</CardTitle>
                <CardDescription>להצגה לדיירים או לשימוש פנימי.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bank_name">שם הבנק</Label>
                  <Input
                    id="bank_name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_branch">מספר סניף</Label>
                  <Input
                    id="bank_branch"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_account_number">מספר חשבון</Label>
                  <Input
                    id="bank_account_number"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bank_account_owner">שם בעל החשבון</Label>
                  <Input
                    id="bank_account_owner"
                    value={bankAccountOwner}
                    onChange={(e) => setBankAccountOwner(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loadingRow || saving}>
                {saving ? "שומר…" : "שמור הגדרות"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void handleCancelEdit()}
              >
                ביטול
              </Button>
            </div>
          </fieldset>
        </form>
      )}
    </div>
  );
}
