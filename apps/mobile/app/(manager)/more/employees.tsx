import { createEmployeeViaWebApi } from "@/lib/create-employee-via-web-api";
import {
  deleteEmployeeViaWebApi,
  updateEmployeeViaWebApi,
} from "@/lib/employee-mutations-via-web-api";
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";
import { USER_ROLE_LABEL, type UserRole } from "@my-project/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type Row = {
  id: string;
  full_name: string;
  phone: string | null;
  is_active: boolean | null;
  role: string;
};

type FieldRoleOption = "cleaner" | "gardener" | "employee";

function mapRoleToFieldSelect(role: string): FieldRoleOption {
  if (role === "gardener") return "gardener";
  if (role === "employee") return "employee";
  return "cleaner";
}

export default function ManagerEmployeesScreen() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [formErr, setFormErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldRole, setFieldRole] = useState<"cleaner" | "gardener">("cleaner");

  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editFieldRole, setEditFieldRole] =
    useState<FieldRoleOption>("cleaner");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPassword, setEditPassword] = useState("");
  const [editErr, setEditErr] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

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

      const { tenantId, businessProfileId } =
        await resolveTenantScopeForUser(supabase, user.id);
      if (!tenantId) {
        setErr("חסר מזהה ארגון");
        return;
      }

      if (!businessProfileId) {
        setErr("חסר פרופיל עסק — צור business_profiles לארגון");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, is_active, role")
        .eq("business_profile_id", businessProfileId)
        .in("role", ["cleaner", "gardener", "employee"])
        .order("full_name");

      if (error) {
        setErr(error.message);
        return;
      }
      setRows(data ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openEdit(r: Row) {
    setEditErr(null);
    setEditingId(r.id);
    setEditFullName(r.full_name);
    setEditPhone(r.phone ?? "");
    setEditFieldRole(mapRoleToFieldSelect(r.role));
    setEditIsActive(r.is_active !== false);
    setEditPassword("");
    setEditOpen(true);
  }

  function confirmDelete(r: Row) {
    Alert.alert(
      "מחיקת עובד",
      `למחוק את ${r.full_name}? פעולה זו תסיר את גישת ההתחברות.`,
      [
        { text: "ביטול", style: "cancel" },
        {
          text: "מחיקה",
          style: "destructive",
          onPress: () => void runDeleteEmployee(r.id),
        },
      ]
    );
  }

  async function runDeleteEmployee(id: string) {
    const res = await deleteEmployeeViaWebApi(id);
    if (!res.ok) {
      Alert.alert("שגיאה", res.error);
      return;
    }
    await load();
    Alert.alert("נמחק", "העובד הוסר מהמערכת.");
  }

  async function onSaveEdit() {
    if (!editingId) return;
    setEditErr(null);
    const pwd = editPassword.trim();
    if (pwd.length > 0 && pwd.length < 6) {
      setEditErr("סיסמה — לפחות 6 תווים.");
      return;
    }
    setEditSaving(true);
    try {
      const res = await updateEmployeeViaWebApi(editingId, {
        full_name: editFullName.trim(),
        phone: editPhone.trim(),
        field_role: editFieldRole,
        is_active: editIsActive,
        new_password: pwd.length >= 6 ? pwd : undefined,
      });
      if (!res.ok) {
        setEditErr(res.error);
        return;
      }
      setEditOpen(false);
      setEditingId(null);
      await load();
      Alert.alert("נשמר", "פרטי העובד עודכנו.");
    } finally {
      setEditSaving(false);
    }
  }

  async function onCreateEmployee() {
    setFormErr(null);
    setSaving(true);
    try {
      const res = await createEmployeeViaWebApi({
        full_name: fullName.trim(),
        phone: phone.trim(),
        password,
        field_role: fieldRole,
      });
      if (!res.ok) {
        setFormErr(res.error);
        return;
      }
      setAddOpen(false);
      setFullName("");
      setPassword("");
      setPhone("");
      setFieldRole("cleaner");
      await load();
      Alert.alert("נוצר", "העובד נוסף בהצלחה.");
    } finally {
      setSaving(false);
    }
  }

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
      </View>
    );
  }

  return (
    <>
      <ScrollView className="flex-1 bg-white px-4 pt-4">
        <View className="mb-4 flex-row items-start justify-between gap-3">
          <Text className="flex-1 text-sm text-gray-600">
            עובדי שטח בארגון. דורש שרת Next עם SUPABASE_SERVICE_ROLE_KEY
            ו־EXPO_PUBLIC_WEB_APP_ORIGIN להוספה מהאפליקציה.
          </Text>
          <Pressable
            className="min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5"
            onPress={() => {
              setFormErr(null);
              setAddOpen(true);
            }}
          >
            <Text className="text-center text-sm font-semibold text-white">
              הוספה
            </Text>
          </Pressable>
        </View>
        {rows.length === 0 ? (
          <Text className="text-gray-500">אין עובדים.</Text>
        ) : (
          <View className="gap-2 pb-8">
            {rows.map((r) => (
              <View
                key={r.id}
                className="rounded-lg border border-slate-200 px-3 py-3"
              >
                <View className="flex-row items-start justify-between gap-2">
                  <View className="min-w-0 flex-1">
                    <Text className="font-semibold">{r.full_name}</Text>
                    <Text className="text-sm text-gray-600">
                      {USER_ROLE_LABEL[r.role as UserRole] ?? r.role} ·{" "}
                      {r.phone ?? "—"}
                    </Text>
                    <Text className="mt-1 text-xs text-gray-400">
                      {r.is_active ? "פעיל" : "לא פעיל"}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-0.5">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`עריכת ${r.full_name}`}
                      className="min-h-[44px] min-w-[44px] items-center justify-center rounded-lg active:bg-slate-100"
                      onPress={() => openEdit(r)}
                    >
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={22}
                        color="#64748b"
                      />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`מחיקת ${r.full_name}`}
                      className="min-h-[44px] min-w-[44px] items-center justify-center rounded-lg active:bg-red-50"
                      onPress={() => confirmDelete(r)}
                    >
                      <MaterialCommunityIcons
                        name="delete-outline"
                        size={22}
                        color="#dc2626"
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={editOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setEditOpen(false)}
      >
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            className="flex-1 justify-end bg-black/45"
            onPress={() => setEditOpen(false)}
          >
            <Pressable
              className="max-h-[88%] rounded-t-2xl bg-white px-4 pb-6 pt-4"
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="mb-1 text-lg font-bold">עריכת עובד</Text>
              <Text className="mb-4 text-sm text-gray-600">
                עדכון פרטים וסיסמה (אופציונלי).
              </Text>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                className="max-h-[70%]"
              >
                <Text className="mb-1 text-xs font-medium text-gray-700">
                  סוג עובד
                </Text>
                <View className="mb-3 flex-row flex-wrap gap-2">
                  {(
                    [
                      ["cleaner", "מנקה"],
                      ["gardener", "גנן"],
                      ["employee", "עובד שטח"],
                    ] as const
                  ).map(([value, label]) => (
                    <Pressable
                      key={value}
                      className={`rounded-lg border px-3 py-2.5 ${editFieldRole === value ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}
                      onPress={() => setEditFieldRole(value)}
                    >
                      <Text className="text-center text-sm font-medium">
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text className="mb-1 text-xs font-medium text-gray-700">
                  שם מלא
                </Text>
                <TextInput
                  className="mb-3 min-h-[44px] rounded-lg border border-gray-300 px-3 py-2.5 text-left"
                  placeholder="שם מלא"
                  value={editFullName}
                  onChangeText={setEditFullName}
                />
                <Text className="mb-1 text-xs font-medium text-gray-700">
                  טלפון נייד (כניסה למערכת)
                </Text>
                <TextInput
                  className="mb-3 min-h-[44px] rounded-lg border border-gray-300 px-3 py-2.5 text-left"
                  placeholder="למשל 050-1234567"
                  keyboardType="phone-pad"
                  value={editPhone}
                  onChangeText={setEditPhone}
                />

                <Pressable
                  className="mb-3 flex-row items-center gap-2"
                  onPress={() => setEditIsActive(!editIsActive)}
                >
                  <View
                    className={`h-5 w-5 rounded border ${editIsActive ? "border-blue-600 bg-blue-600" : "border-gray-400"}`}
                  />
                  <Text className="text-sm text-gray-800">חשבון פעיל</Text>
                </Pressable>

                <Text className="mb-1 text-xs font-medium text-gray-700">
                  סיסמה חדשה (אופציונלי)
                </Text>
                <TextInput
                  className="mb-3 min-h-[44px] rounded-lg border border-gray-300 px-3 py-2.5 text-left"
                  placeholder="השאר ריק כדי לא לשנות"
                  secureTextEntry
                  value={editPassword}
                  onChangeText={setEditPassword}
                />
                {editErr ? (
                  <Text className="mb-3 text-sm text-red-600">{editErr}</Text>
                ) : null}
              </ScrollView>

              <Pressable
                className="mt-2 min-h-[48px] items-center justify-center rounded-lg bg-blue-600 py-3.5 disabled:opacity-50"
                disabled={
                  editSaving ||
                  !editFullName.trim() ||
                  !editPhone.trim() ||
                  (editPassword.trim().length > 0 &&
                    editPassword.trim().length < 6)
                }
                onPress={() => void onSaveEdit()}
              >
                <Text className="text-center font-semibold text-white">
                  {editSaving ? "שומר…" : "שמירה"}
                </Text>
              </Pressable>

              <Pressable
                className="mt-2 min-h-[48px] items-center justify-center rounded-lg border border-gray-300 py-3.5"
                onPress={() => setEditOpen(false)}
              >
                <Text className="text-center font-medium text-slate-700">
                  ביטול
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={addOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAddOpen(false)}
      >
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            className="flex-1 justify-end bg-black/45"
            onPress={() => setAddOpen(false)}
          >
            <Pressable
              className="max-h-[88%] rounded-t-2xl bg-white px-4 pb-6 pt-4"
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="mb-1 text-lg font-bold">עובד חדש</Text>
              <Text className="mb-4 text-sm text-gray-600">
                מספר טלפון נייד ישראלי וסיסמה — כמו מסך ההתחברות.
              </Text>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                className="max-h-[70%]"
              >
                <Text className="mb-1 text-xs font-medium text-gray-700">
                  סוג עובד
                </Text>
                <View className="mb-3 flex-row gap-2">
                  <Pressable
                    className={`flex-1 rounded-lg border px-3 py-2.5 ${fieldRole === "cleaner" ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}
                    onPress={() => setFieldRole("cleaner")}
                  >
                    <Text className="text-center text-sm font-medium">מנקה</Text>
                  </Pressable>
                  <Pressable
                    className={`flex-1 rounded-lg border px-3 py-2.5 ${fieldRole === "gardener" ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}
                    onPress={() => setFieldRole("gardener")}
                  >
                    <Text className="text-center text-sm font-medium">גנן</Text>
                  </Pressable>
                </View>

                <Text className="mb-1 text-xs font-medium text-gray-700">
                  שם מלא
                </Text>
                <TextInput
                  className="mb-3 min-h-[44px] rounded-lg border border-gray-300 px-3 py-2.5 text-left"
                  placeholder="שם מלא"
                  value={fullName}
                  onChangeText={setFullName}
                />
                <Text className="mb-1 text-xs font-medium text-gray-700">
                  טלפון נייד (כניסה למערכת)
                </Text>
                <TextInput
                  className="mb-3 min-h-[44px] rounded-lg border border-gray-300 px-3 py-2.5 text-left"
                  placeholder="למשל 050-1234567"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
                <Text className="mb-1 text-xs font-medium text-gray-700">
                  סיסמה ראשונית (לפחות 6 תווים)
                </Text>
                <TextInput
                  className="mb-3 min-h-[44px] rounded-lg border border-gray-300 px-3 py-2.5 text-left"
                  placeholder="סיסמה"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                {formErr ? (
                  <Text className="mb-3 text-sm text-red-600">{formErr}</Text>
                ) : null}
              </ScrollView>

              <Pressable
                className="mt-2 min-h-[48px] items-center justify-center rounded-lg bg-blue-600 py-3.5 disabled:opacity-50"
                disabled={
                  saving ||
                  !fullName.trim() ||
                  !phone.trim() ||
                  password.length < 6
                }
                onPress={() => void onCreateEmployee()}
              >
                <Text className="text-center font-semibold text-white">
                  {saving ? "יוצר…" : "יצירת עובד"}
                </Text>
              </Pressable>

              <Pressable
                className="mt-2 min-h-[48px] items-center justify-center rounded-lg border border-gray-300 py-3.5"
                onPress={() => setAddOpen(false)}
              >
                <Text className="text-center font-medium text-slate-700">
                  ביטול
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
