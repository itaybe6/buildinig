import { LogoutButton } from "@/components/LogoutButton";
import {
  patchResidentPasswordViaWebApi,
  patchResidentProfileViaWebApi,
} from "@/lib/patch-resident-profile";
import { supabase } from "@/lib/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { normalizeIsraelPhoneLocalDigits } from "@my-project/shared";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-gray-900";

function formatIsraelPhoneDisplay(phone: string | null): string {
  if (!phone?.trim()) return "לא צוין";
  const d = phone.replace(/\D/g, "");
  if (d.length === 9 && d.startsWith("5")) {
    return `0${d.slice(0, 2)}-${d.slice(2)}`;
  }
  if (d.length === 10 && d.startsWith("05")) {
    return `${d.slice(0, 3)}-${d.slice(3)}`;
  }
  return phone.trim();
}

export default function ResidentAccountScreen() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

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

      const { data: row, error } = await supabase
        .from("profiles")
        .select("full_name, phone, role")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (error || !row) {
        setErr(error?.message ?? "לא נמצא פרופיל");
        return;
      }

      if (row.role !== "resident") {
        setErr("מסך זה לממשק דייר בלבד");
        return;
      }

      setFullName(row.full_name ?? "");
      setPhone((row.phone && String(row.phone).trim()) || "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openEditModal() {
    setEditFullName(fullName.trim());
    setEditPhone(phone.trim());
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setProfileModalOpen(true);
  }

  async function saveProfile() {
    const fn = editFullName.trim();
    if (!fn) {
      Alert.alert("שגיאה", "חובה שם מלא");
      return;
    }
    const normalized = editPhone.trim()
      ? normalizeIsraelPhoneLocalDigits(editPhone)
      : null;
    if (editPhone.trim() && !normalized) {
      Alert.alert("שגיאה", "מספר טלפון לא תקין (למשל 050-1234567)");
      return;
    }
    setSavingProfile(true);
    const r = await patchResidentProfileViaWebApi({
      full_name: fn,
      phone: normalized,
    });
    setSavingProfile(false);
    if (!r.ok) {
      Alert.alert("שגיאה", r.error);
      return;
    }
    Alert.alert("נשמר", "פרטי הפרופיל עודכנו.");
    void load();
  }

  async function savePassword() {
    if (newPassword.length < 6) {
      Alert.alert("שגיאה", "סיסמה חדשה — לפחות 6 תווים");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("שגיאה", "הסיסמאות החדשות אינן תואמות");
      return;
    }
    setSavingPwd(true);
    const r = await patchResidentPasswordViaWebApi({
      currentPassword,
      newPassword,
    });
    setSavingPwd(false);
    if (!r.ok) {
      Alert.alert("שגיאה", r.error);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    Alert.alert("עודכן", "הסיסמה עודכנה.");
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator />
      </View>
    );
  }

  if (err) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-4">
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

  return (
    <ScrollView className="flex-1 bg-slate-50 px-4 pb-8 pt-4">
      <Text className="mb-4 text-sm text-gray-600">
        פרטי החשבון שלך. עריכה ושינוי סיסמה נשמרים בשרת Next (כשהוגדר
        EXPO_PUBLIC_WEB_APP_ORIGIN).
      </Text>

      <View className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <View className="mb-3 flex-row items-center justify-between gap-2">
          <Text className="text-xs font-medium uppercase text-gray-500">
            הפרטים שלי
          </Text>
          <Pressable
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white active:opacity-80"
            onPress={() => openEditModal()}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={22}
              color="#334155"
            />
          </Pressable>
        </View>
        <View className="gap-3">
          <View>
            <Text className="mb-0.5 text-xs text-gray-500">שם</Text>
            <Text className="text-base font-medium text-slate-900">
              {fullName.trim() || "—"}
            </Text>
          </View>
          <View>
            <Text className="mb-0.5 text-xs text-gray-500">טלפון</Text>
            <Text className="text-base font-medium text-slate-900 tabular-nums">
              {formatIsraelPhoneDisplay(phone || null)}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-4 items-stretch">
        <LogoutButton />
      </View>

      <Modal
        visible={profileModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setProfileModalOpen(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            className="flex-1 bg-black/40"
            onPress={() => setProfileModalOpen(false)}
          />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            className="max-h-[90%] rounded-t-2xl bg-white px-4 pb-8 pt-4"
          >
            <Text className="mb-4 text-lg font-semibold text-slate-900">
              עריכת פרטים
            </Text>

            <Text className="mb-1 text-xs text-gray-500">שם מלא</Text>
            <TextInput
              value={editFullName}
              onChangeText={setEditFullName}
              className={`${inputClass} mb-3`}
            />
            <Text className="mb-1 text-xs text-gray-500">טלפון נייד</Text>
            <TextInput
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
              className={`${inputClass} mb-4`}
            />
            <Pressable
              onPress={() => void saveProfile()}
              disabled={savingProfile}
              className={`rounded-xl py-3 ${savingProfile ? "bg-slate-300" : "bg-blue-600"}`}
            >
              <Text className="text-center font-medium text-white">
                {savingProfile ? "שומר…" : "שמור פרטים"}
              </Text>
            </Pressable>

            <View className="my-6 border-t border-slate-100 pt-4">
              <Text className="mb-1 text-base font-semibold text-slate-900">
                שינוי סיסמה
              </Text>
              <Text className="mb-3 text-xs leading-relaxed text-gray-500">
                להגדרת סיסמה חדשה מלאו את השדות למטה.
              </Text>

              <Text className="mb-1 text-xs text-gray-500">סיסמה נוכחית</Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                className={`${inputClass} mb-3`}
              />

              <Text className="mb-1 text-xs text-gray-500">סיסמה חדשה</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                className={`${inputClass} mb-3`}
              />

              <Text className="mb-1 text-xs text-gray-500">אימות סיסמה</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                className={`${inputClass} mb-4`}
              />

              <Pressable
                onPress={() => void savePassword()}
                disabled={savingPwd}
                className={`rounded-xl py-3 ${savingPwd ? "bg-slate-300" : "bg-slate-700"}`}
              >
                <Text className="text-center font-medium text-white">
                  {savingPwd ? "מעדכן…" : "עדכן סיסמה"}
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setProfileModalOpen(false)}
              className="mt-4 py-2"
            >
              <Text className="text-center text-slate-600">סגור</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}
