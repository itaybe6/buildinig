import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

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

type BuildingRow = { id: string; label: string };

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

export default function ManagerPaymentSettingsScreen() {
  const [initErr, setInitErr] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<BuildingRow[]>([]);
  const [buildingId, setBuildingId] = useState("");
  const [loadingRow, setLoadingRow] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsExist, setSettingsExist] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setInitErr(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setInitErr("לא מחובר");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!profile || profile.role !== "manager") {
          setInitErr("דף זה זמין למנהלי ועד בית בלבד.");
          return;
        }

        const { businessProfileId } = await resolveTenantScopeForUser(
          supabase,
          user.id
        );
        if (!businessProfileId) {
          setInitErr("חסר פרופיל עסק.");
          return;
        }

        const { data: bRows, error: bErr } = await supabase
          .from("buildings")
          .select("id, address, city")
          .eq("business_profile_id", businessProfileId)
          .order("address");

        if (bErr) {
          setInitErr(bErr.message);
          return;
        }
        if (!bRows?.length) {
          setInitErr("אין בניינים — הוסיפו בניין כדי להגדיר תשלומים.");
          return;
        }

        const opts = bRows.map((b) => ({
          id: b.id,
          label: `${b.address}, ${b.city}`,
        }));
        if (!cancelled) {
          setBuildings(opts);
          setBuildingId(opts[0].id);
        }
      } catch (e) {
        if (!cancelled) {
          setInitErr(e instanceof Error ? e.message : "שגיאה");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSettings = useCallback(async (bid: string): Promise<void> => {
    if (!bid) return;
    setLoadingRow(true);
    const { data, error } = await supabase
      .from("payment_settings")
      .select(
        "collection_day, reminder_days_before, reminder_message_template, unpaid_alert_enabled, unpaid_alert_days_after, bank_name, bank_branch, bank_account_number, bank_account_owner"
      )
      .eq("building_id", bid)
      .maybeSingle();

    if (error) {
      Alert.alert("שגיאה", error.message);
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
  }, []);

  useEffect(() => {
    if (buildingId) void loadSettings(buildingId);
  }, [buildingId, loadSettings]);

  useEffect(() => {
    setIsEditing(false);
  }, [buildingId]);

  async function handleCancelEdit() {
    await loadSettings(buildingId);
    setIsEditing(false);
  }

  async function onSave() {
    if (!buildingId) return;

    const day = collectionDay;
    const before = reminderDaysBefore;
    const after = unpaidAlertDaysAfter;

    if (!Number.isInteger(day) || day < 1 || day > 28) {
      Alert.alert("שגיאה", "יום הגביה חייב להיות בין 1 ל־28.");
      return;
    }
    if (!Number.isInteger(before) || before < 0) {
      Alert.alert("שגיאה", "ימים לפני תזכורת חייבים להיות מספר שלם חיובי או אפס.");
      return;
    }
    if (unpaidAlertEnabled) {
      if (!Number.isInteger(after) || after < 0) {
        Alert.alert(
          "שגיאה",
          "ימים אחרי הגביה להתראה חייבים להיות מספר שלם חיובי או אפס."
        );
        return;
      }
    }

    setSaving(true);

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
      Alert.alert("שגיאה", error.message);
      return;
    }
    await loadSettings(buildingId);
    setIsEditing(false);
    Alert.alert("נשמר", "ההגדרות נשמרו בהצלחה.");
  }

  if (initErr) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-center text-red-600">{initErr}</Text>
      </View>
    );
  }

  if (!buildings.length || !buildingId) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  const inputCls =
    "mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-900";

  const readOnlyBox =
    "mt-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-base text-slate-900";

  const buildingPickDisabled = loadingRow || saving || isEditing;

  return (
    <ScrollView
      className="flex-1 bg-white px-4 pt-4"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="mb-4 text-sm text-slate-600">
        הגדרות גביה, תזכורות והתראות — לפי בניין.
      </Text>

      {buildings.length > 1 ? (
        <View className="mb-6">
          <Text className="mb-2 text-sm font-medium text-slate-800">בניין</Text>
          <View className="gap-2 opacity-100">
            {buildings.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => {
                  if (!buildingPickDisabled) setBuildingId(b.id);
                }}
                disabled={buildingPickDisabled}
                className={`rounded-lg border px-3 py-3 ${
                  buildingId === b.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 bg-white"
                } ${buildingPickDisabled ? "opacity-50" : ""}`}
              >
                <Text className="text-base">{b.label}</Text>
              </Pressable>
            ))}
          </View>
          {isEditing ? (
            <Text className="mt-2 text-xs text-slate-500">
              יציאה ממצב עריכה או שמירה מאפשרות החלפת בניין.
            </Text>
          ) : null}
        </View>
      ) : null}

      {loadingRow ? (
        <View className="py-8 items-center">
          <ActivityIndicator />
          <Text className="mt-2 text-sm text-slate-500">טוען הגדרות…</Text>
        </View>
      ) : !isEditing ? (
        <View className="gap-6 pb-10">
          {!settingsExist ? (
            <View className="rounded-xl border border-slate-200 bg-white p-4">
              <Text className="mb-1 text-lg font-semibold text-slate-900">
                עדיין לא הוגדר
              </Text>
              <Text className="mb-4 text-sm text-slate-600">
                לא נשמרו הגדרות תשלום לבניין שנבחר. ניתן להגדיר אותן כעת.
              </Text>
              <Pressable
                onPress={() => setIsEditing(true)}
                className="self-start rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700"
              >
                <Text className="text-center text-base font-semibold text-white">
                  הגדר עכשיו
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View className="flex-row flex-wrap items-center justify-between gap-3">
                <Text className="flex-1 text-sm text-slate-600">
                  סקירת ההגדרות השמורות.
                </Text>
                <Pressable
                  onPress={() => setIsEditing(true)}
                  className="rounded-lg border border-blue-600 bg-white px-4 py-2 active:bg-slate-50"
                >
                  <Text className="font-semibold text-blue-700">עריכה</Text>
                </Pressable>
              </View>

              <View>
                <Text className="mb-2 text-lg font-semibold text-slate-900">
                  הגדרות גביה
                </Text>
                <Text className="text-xs text-slate-500">יום גביה בחודש</Text>
                <Text className={readOnlyBox}>{collectionDay}</Text>
                <Text className="mt-3 text-xs text-slate-500">
                  ימים לפני הגביה — תזכורת
                </Text>
                <Text className={readOnlyBox}>{reminderDaysBefore}</Text>
              </View>

              <View>
                <Text className="mb-2 text-lg font-semibold text-slate-900">
                  תבנית הודעת תזכורת
                </Text>
                <Text className={`${readOnlyBox} min-h-[80px]`}>
                  {displayOrDash(reminderTemplate)}
                </Text>
              </View>

              <View>
                <Text className="mb-2 text-lg font-semibold text-slate-900">
                  התראה על אי־תשלום
                </Text>
                <Text className="text-xs text-slate-500">סטטוס</Text>
                <Text className={readOnlyBox}>
                  {unpaidAlertEnabled ? "מופעל" : "כבוי"}
                </Text>
                {unpaidAlertEnabled ? (
                  <>
                    <Text className="mt-3 text-xs text-slate-500">
                      ימים אחרי יום הגביה
                    </Text>
                    <Text className={readOnlyBox}>{unpaidAlertDaysAfter}</Text>
                  </>
                ) : null}
              </View>

              <View>
                <Text className="mb-2 text-lg font-semibold text-slate-900">
                  פרטי חשבון בנק
                </Text>
                <Text className="text-xs text-slate-500">שם הבנק</Text>
                <Text className={readOnlyBox}>{displayOrDash(bankName)}</Text>
                <Text className="mt-3 text-xs text-slate-500">מספר סניף</Text>
                <Text className={readOnlyBox}>{displayOrDash(bankBranch)}</Text>
                <Text className="mt-3 text-xs text-slate-500">מספר חשבון</Text>
                <Text className={readOnlyBox}>
                  {displayOrDash(bankAccountNumber)}
                </Text>
                <Text className="mt-3 text-xs text-slate-500">
                  שם בעל החשבון
                </Text>
                <Text className={readOnlyBox}>
                  {displayOrDash(bankAccountOwner)}
                </Text>
              </View>
            </>
          )}
        </View>
      ) : (
        <View className="gap-6 pb-10">
          <View>
            <Text className="mb-2 text-lg font-semibold text-slate-900">
              הגדרות גביה
            </Text>
            <Text className="mb-2 text-xs text-slate-500">יום גביה בחודש</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row flex-wrap gap-2">
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setCollectionDay(d)}
                    className={`min-w-[44px] items-center rounded-lg border px-3 py-2 ${
                      collectionDay === d
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <Text
                      className={
                        collectionDay === d
                          ? "font-semibold text-blue-800"
                          : "text-slate-800"
                      }
                    >
                      {d}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text className="mb-1 mt-4 text-xs text-slate-500">
              ימים לפני הגביה — תזכורת
            </Text>
            <TextInput
              className={inputCls}
              keyboardType="number-pad"
              value={String(reminderDaysBefore)}
              onChangeText={(t) =>
                setReminderDaysBefore(Number.parseInt(t, 10) || 0)
              }
              editable={!saving}
            />
          </View>

          <View>
            <Text className="mb-2 text-lg font-semibold text-slate-900">
              תבנית הודעת תזכורת
            </Text>
            <TextInput
              className={`${inputCls} min-h-[120px] py-3`}
              multiline
              textAlignVertical="top"
              value={reminderTemplate}
              onChangeText={setReminderTemplate}
              placeholder="לדוגמה: שלום {{tenant_name}}..."
              editable={!saving}
            />
            <Text className="mt-2 text-xs leading-relaxed text-slate-500">
              משתנים: {"{{tenant_name}}"}, {"{{amount}}"},{" "}
              {"{{collection_date}}"}, {"{{building_name}}"}
            </Text>
          </View>

          <View>
            <Text className="mb-2 text-lg font-semibold text-slate-900">
              התראה על אי־תשלום
            </Text>
            <View className="flex-row items-center justify-between gap-3 py-1">
              <Text className="flex-1 text-sm text-slate-800">
                להפעיל התראה למנהל
              </Text>
              <Switch
                value={unpaidAlertEnabled}
                onValueChange={setUnpaidAlertEnabled}
                disabled={saving}
              />
            </View>
            {unpaidAlertEnabled ? (
              <View className="mt-3">
                <Text className="mb-1 text-xs text-slate-500">
                  ימים אחרי יום הגביה
                </Text>
                <TextInput
                  className={inputCls}
                  keyboardType="number-pad"
                  value={String(unpaidAlertDaysAfter)}
                  onChangeText={(t) =>
                    setUnpaidAlertDaysAfter(Number.parseInt(t, 10) || 0)
                  }
                  editable={!saving}
                />
              </View>
            ) : null}
          </View>

          <View>
            <Text className="mb-2 text-lg font-semibold text-slate-900">
              פרטי חשבון בנק
            </Text>
            <Text className="mb-1 text-xs text-slate-500">שם הבנק</Text>
            <TextInput
              className={inputCls}
              value={bankName}
              onChangeText={setBankName}
              editable={!saving}
            />
            <Text className="mb-1 mt-3 text-xs text-slate-500">מספר סניף</Text>
            <TextInput
              className={inputCls}
              value={bankBranch}
              onChangeText={setBankBranch}
              editable={!saving}
            />
            <Text className="mb-1 mt-3 text-xs text-slate-500">מספר חשבון</Text>
            <TextInput
              className={inputCls}
              value={bankAccountNumber}
              onChangeText={setBankAccountNumber}
              editable={!saving}
            />
            <Text className="mb-1 mt-3 text-xs text-slate-500">
              שם בעל החשבון
            </Text>
            <TextInput
              className={inputCls}
              value={bankAccountOwner}
              onChangeText={setBankAccountOwner}
              editable={!saving}
            />
          </View>

          <View className="gap-3">
            <Pressable
              onPress={() => void onSave()}
              disabled={saving || loadingRow}
              className="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700 disabled:opacity-50"
            >
              <Text className="text-center text-base font-semibold text-white">
                {saving ? "שומר…" : "שמור הגדרות"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void handleCancelEdit()}
              disabled={saving}
              className="rounded-lg border border-slate-300 bg-white px-4 py-3 active:bg-slate-50 disabled:opacity-50"
            >
              <Text className="text-center text-base font-semibold text-slate-800">
                ביטול
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
