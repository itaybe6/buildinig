import {
  patchManagerBusinessViaWebApi,
  patchManagerUserProfileViaWebApi,
} from "@/lib/patch-manager-profile";
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { pickCompressAndUploadBusinessLogo } from "@/lib/upload-business-logo";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-gray-900";

export default function ManagerProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [scopeTenantId, setScopeTenantId] = useState("");
  const [bpId, setBpId] = useState("");
  const [bpName, setBpName] = useState("");
  const [bpLegal, setBpLegal] = useState("");
  const [bpTax, setBpTax] = useState("");
  const [bpCe, setBpCe] = useState("");
  const [bpCp, setBpCp] = useState("");
  const [bpColor, setBpColor] = useState("");
  const [bpLogo, setBpLogo] = useState("");
  const [bpNotes, setBpNotes] = useState("");
  const [bpPlan, setBpPlan] = useState<string | null>(null);
  const [bpActive, setBpActive] = useState<boolean | null>(null);

  const [editBusiness, setEditBusiness] = useState(false);
  const [editAccount, setEditAccount] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [fullName, setFullName] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");

  const [authEmail, setAuthEmail] = useState("");
  const [initialAuthEmail, setInitialAuthEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAuth, setSavingAuth] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErr("לא מחובר");
        return;
      }

      const em = user.email ?? "";
      setAuthEmail(em);
      setInitialAuthEmail(em);

      const { tenantId, businessProfileId } = await resolveTenantScopeForUser(
        supabase,
        user.id
      );
      if (!tenantId) {
        setErr("חסר מזהה ארגון");
        return;
      }
      if (!businessProfileId) {
        setErr("חסר פרופיל עסק");
        return;
      }

      setScopeTenantId(tenantId);

      const { data: pRow, error: pErr } = await supabase
        .from("profiles")
        .select("role, full_name, phone")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (pErr || !pRow) {
        setErr(pErr?.message ?? "לא נמצא פרופיל משתמש");
        return;
      }

      if (pRow.role !== "manager") {
        setErr("המסך זמין למנהלים בלבד");
        return;
      }

      setFullName(pRow.full_name);
      setMobilePhone((pRow.phone && String(pRow.phone).trim()) || "");

      const { data: bp, error: bErr } = await supabase
        .from("business_profiles")
        .select(
          "id, name, logo_url, primary_color, contact_email, contact_phone, legal_name, tax_id, notes, plan, is_active"
        )
        .eq("id", tenantId)
        .maybeSingle();

      if (bErr || !bp) {
        setErr(bErr?.message ?? "לא נמצא פרופיל עסק");
        return;
      }

      setBpId(bp.id);
      setBpName(bp.name);
      setBpLegal(bp.legal_name ?? "");
      setBpTax(bp.tax_id ?? "");
      setBpCe(bp.contact_email ?? "");
      setBpCp(bp.contact_phone ?? "");
      setBpColor(bp.primary_color ?? "");
      setBpLogo(bp.logo_url ?? "");
      setBpNotes(bp.notes ?? "");
      setBpPlan(bp.plan);
      setBpActive(bp.is_active);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onPickLogo = async () => {
    if (!scopeTenantId) return;
    setUploadingLogo(true);
    const r = await pickCompressAndUploadBusinessLogo(supabase, scopeTenantId);
    setUploadingLogo(false);
    if (!r.ok) {
      if (r.error === "ביטול בחירה") return;
      Alert.alert("שגיאה", r.error);
      return;
    }
    setBpLogo(r.publicUrl);
  };

  const saveBusiness = async () => {
    const name = bpName.trim();
    if (!name) {
      Alert.alert("שגיאה", "חובה למלא שם עסק");
      return;
    }
    setSavingBusiness(true);
    const r = await patchManagerBusinessViaWebApi({
      name,
      logo_url: bpLogo.trim() || null,
      primary_color: bpColor.trim() || null,
      contact_email: bpCe.trim() || null,
      contact_phone: bpCp.trim() || null,
      legal_name: bpLegal.trim() || null,
      tax_id: bpTax.trim() || null,
      notes: bpNotes.trim() || null,
    });
    setSavingBusiness(false);
    if (!r.ok) {
      Alert.alert("שגיאה", r.error);
      return;
    }
    Alert.alert("נשמר", "פרטי העסק עודכנו.");
    setEditBusiness(false);
    void load();
  };

  const saveProfile = async () => {
    const fn = fullName.trim();
    if (!fn) {
      Alert.alert("שגיאה", "חובה למלא שם מלא");
      return;
    }
    setSavingProfile(true);
    const r = await patchManagerUserProfileViaWebApi({
      full_name: fn,
      phone: mobilePhone.trim() || null,
    });
    setSavingProfile(false);
    if (!r.ok) {
      Alert.alert("שגיאה", r.error);
      return;
    }
    Alert.alert("נשמר", "פרטי הפרופיל עודכנו.");
    void load();
  };

  const saveAuth = async () => {
    const emailNext = authEmail.trim();
    const p1 = newPassword.trim();
    const p2 = newPassword2.trim();

    if (p1 || p2) {
      if (p1.length < 6) {
        Alert.alert("שגיאה", "סיסמה חייבת להכיל לפחות 6 תווים");
        return;
      }
      if (p1 !== p2) {
        Alert.alert("שגיאה", "הסיסמאות אינן תואמות");
        return;
      }
    }

    const payload: { email?: string; password?: string } = {};
    if (emailNext && emailNext !== initialAuthEmail) {
      payload.email = emailNext;
    }
    if (p1) {
      payload.password = p1;
    }

    if (!payload.email && !payload.password) {
      Alert.alert("שגיאה", "לא שינית אימייל או סיסמה");
      return;
    }

    setSavingAuth(true);
    const { error } = await supabase.auth.updateUser(payload);
    setSavingAuth(false);
    if (error) {
      Alert.alert("שגיאה", error.message);
      return;
    }
    setNewPassword("");
    setNewPassword2("");
    if (payload.email) {
      setInitialAuthEmail(emailNext);
    }
    Alert.alert(
      "עודכן",
      payload.email
        ? "ייתכן שתתבקש לאשר את האימייל החדש."
        : "הסיסמה עודכנה."
    );
    void load();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (err) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-center text-red-600">{err}</Text>
        <Pressable
          onPress={() => void load()}
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2"
        >
          <Text>נסה שוב</Text>
        </Pressable>
      </View>
    );
  }

  const logoUri = bpLogo.trim();

  return (
    <ScrollView className="flex-1 bg-slate-50 px-4 pt-4">
      <Text className="mb-6 text-sm text-gray-600">
        צפייה בפרטים ועריכה לפי צורך. שמירת עסק/פרופיל דורשת שרת Next מוגדר ב-
        EXPO_PUBLIC_WEB_APP_ORIGIN.
      </Text>

      {/* חשבון: פרופיל + כניסה מקוננת */}
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-slate-900">פרטי משתמש</Text>
        {!editAccount ? (
          <Pressable
            onPress={() => setEditAccount(true)}
            className="rounded-lg border border-blue-600 px-3 py-1.5 active:opacity-80"
          >
            <Text className="text-sm font-medium text-blue-600">עריכה</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              setEditAccount(false);
              void load();
            }}
            className="rounded-lg border border-slate-400 px-3 py-1.5 active:opacity-80"
          >
            <Text className="text-sm font-medium text-slate-700">חזרה לצפייה</Text>
          </Pressable>
        )}
      </View>

      <View className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <View className="border-b border-slate-100 bg-slate-50/90 px-4 py-3">
          <Text className="text-xs text-gray-500">
            שם ופלאפון ב-profiles; למטה פרטי כניסה ל-Supabase.
          </Text>
        </View>

        <View className="gap-4 p-4">
          {!editAccount ? (
            <>
              <Row label="שם מלא" value={fullName.trim() || "—"} />
              <Row label="פלאפון" value={mobilePhone.trim() || "—"} />

              <View className="mt-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <Text className="mb-1 text-sm font-semibold text-slate-900">
                  כניסה (אימייל וסיסמה)
                </Text>
                <Text className="mb-3 text-xs text-gray-500">
                  עדכון חשבון — משפיע על כל האפליקציות.
                </Text>
                <Row
                  label="אימייל כניסה"
                  value={authEmail.trim() || "—"}
                  mono
                />
                <Text className="mt-3 text-xs text-gray-500">
                  לשינוי אימייל או סיסמה — לחץ &quot;עריכה&quot; למעלה.
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text className="text-sm font-medium text-slate-800">פרטי פרופיל</Text>
              <Field label="שם מלא" value={fullName} onChangeText={setFullName} />
              <Field
                label="פלאפון"
                value={mobilePhone}
                onChangeText={setMobilePhone}
                keyboardType="phone-pad"
              />
              <SaveButton
                label={savingProfile ? "שומר…" : "שמור פרטי פרופיל"}
                onPress={() => void saveProfile()}
                disabled={savingProfile}
              />

              <View className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <Text className="mb-1 text-sm font-semibold text-slate-900">
                  כניסה (אימייל וסיסמה)
                </Text>
                <Text className="mb-3 text-xs text-gray-500">
                  עדכון חשבון Supabase — משפיע על כל האפליקציות.
                </Text>
                <Field
                  label="אימייל כניסה"
                  value={authEmail}
                  onChangeText={setAuthEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Field
                  label="סיסמה חדשה (אופציונלי)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <Field
                  label="אימות סיסמה"
                  value={newPassword2}
                  onChangeText={setNewPassword2}
                  secureTextEntry
                />
                <SaveButton
                  label={savingAuth ? "שומר…" : "עדכן אימייל / סיסמה"}
                  onPress={() => void saveAuth()}
                  disabled={savingAuth}
                />
              </View>
            </>
          )}
        </View>
      </View>

      {/* פרטי עסק */}
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-slate-900">פרטי עסק</Text>
        {!editBusiness ? (
          <Pressable
            onPress={() => setEditBusiness(true)}
            className="rounded-lg border border-blue-600 px-3 py-1.5 active:opacity-80"
          >
            <Text className="text-sm font-medium text-blue-600">עריכה</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="mb-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {!editBusiness ? (
          <View className="gap-4">
            <View className="flex-row gap-4">
              <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {logoUri ? (
                  <Image
                    source={{ uri: logoUri }}
                    className="h-full w-full"
                    resizeMode="contain"
                  />
                ) : (
                  <Text className="px-2 text-center text-xs text-gray-400">
                    ללא לוגו
                  </Text>
                )}
              </View>
              <View className="flex-1 justify-center">
                <Text className="text-xl font-bold text-slate-900">
                  {bpName}
                </Text>
                {bpLegal ? (
                  <Text className="mt-1 text-sm text-gray-600">{bpLegal}</Text>
                ) : null}
              </View>
            </View>
            <Row label="אימייל יצירת קשר" value={bpCe || "—"} />
            <Row label="טלפון" value={bpCp || "—"} />
            <Row label="ח״פ / עוסק" value={bpTax || "—"} />
            <Row label="צבע ראשי" value={bpColor || "—"} mono />
            {bpNotes ? (
              <View>
                <Text className="mb-1 text-xs text-gray-500">הערות</Text>
                <Text className="text-sm text-slate-800">{bpNotes}</Text>
              </View>
            ) : null}
            <View className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-3">
              <Text className="text-xs text-gray-600">
                תוכנית: {bpPlan ?? "—"}
              </Text>
              <Text className="mt-1 text-xs text-gray-600">
                פעיל: {bpActive !== false ? "כן" : "לא"}
              </Text>
              <Text className="mt-1 font-mono text-[11px] text-gray-500">
                מזהה: {bpId}
              </Text>
            </View>
          </View>
        ) : (
          <View className="gap-3">
            <Text className="mb-1 text-xs text-gray-500">לוגו העסק</Text>
            <View className="flex-row flex-wrap items-center gap-3">
              <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                {logoUri ? (
                  <Image
                    source={{ uri: logoUri }}
                    className="h-full w-full"
                    resizeMode="contain"
                  />
                ) : (
                  <Text className="text-[10px] text-gray-400">אין</Text>
                )}
              </View>
              <View className="flex-1 gap-2">
                <Pressable
                  onPress={() => void onPickLogo()}
                  disabled={uploadingLogo}
                  className={`rounded-lg py-2 ${uploadingLogo ? "bg-slate-200" : "bg-blue-600"}`}
                >
                  <Text className="text-center text-sm font-medium text-white">
                    {uploadingLogo ? "מעלה…" : logoUri ? "החלפת לוגו" : "העלאת לוגו"}
                  </Text>
                </Pressable>
                {logoUri ? (
                  <Pressable onPress={() => setBpLogo("")}>
                    <Text className="text-center text-sm text-gray-500">
                      הסרת לוגו מהתצוגה
                    </Text>
                  </Pressable>
                ) : null}
                <Text className="text-[11px] text-gray-500">
                  התמונה תידחס לפני העלאה (עד ~512px רוחב).
                </Text>
              </View>
            </View>

            <Field label="שם מוצג" value={bpName} onChangeText={setBpName} />
            <Field label="שם משפטי" value={bpLegal} onChangeText={setBpLegal} />
            <Field label="ח״פ / עוסק" value={bpTax} onChangeText={setBpTax} />
            <Field
              label="אימייל יצירת קשר"
              value={bpCe}
              onChangeText={setBpCe}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="טלפון"
              value={bpCp}
              onChangeText={setBpCp}
              keyboardType="phone-pad"
            />
            <Field
              label="צבע ראשי (#hex)"
              value={bpColor}
              onChangeText={setBpColor}
            />
            <Field label="הערות" value={bpNotes} onChangeText={setBpNotes} />

            <View className="mt-2 flex-row flex-wrap gap-2">
              <Pressable
                onPress={() => void saveBusiness()}
                disabled={savingBusiness}
                className={`flex-1 rounded-lg py-3 ${savingBusiness ? "bg-slate-300" : "bg-blue-600"}`}
              >
                <Text className="text-center font-medium text-white">
                  {savingBusiness ? "שומר…" : "שמור"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setEditBusiness(false);
                  void load();
                }}
                className="flex-1 rounded-lg border border-slate-300 py-3"
              >
                <Text className="text-center text-slate-700">ביטול</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View>
      <Text className="mb-0.5 text-xs text-gray-500">{label}</Text>
      <Text className={`text-sm text-slate-800 ${mono ? "font-mono" : ""}`}>
        {value}
      </Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  editable = true,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText?: (t: string) => void;
  editable?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences";
  secureTextEntry?: boolean;
}) {
  return (
    <View>
      <Text className="mb-1 text-xs text-gray-500">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        className={inputClass}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

function SaveButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`rounded-lg py-3 ${disabled ? "bg-slate-200" : "bg-blue-600"}`}
    >
      <Text className="text-center font-medium text-white">{label}</Text>
    </Pressable>
  );
}
