import { inviteResidentToBuildingViaWebApi } from "@/lib/invite-building-resident";
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_active: boolean | null;
};

type UnitRow = {
  id: string;
  unit_number: string;
  floor_number: number | null;
  monthly_fee: string | null;
};

export default function ManagerBuildingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErr("לא מחובר");
      setLoading(false);
      return;
    }

    const { businessProfileId } = await resolveTenantScopeForUser(
      supabase,
      user.id
    );
    if (!businessProfileId) {
      setErr("חסר פרופיל עסק");
      setLoading(false);
      return;
    }

    const bid = Array.isArray(id) ? id[0] : id;

    const { data: building, error: bErr } = await supabase
      .from("buildings")
      .select("address, city")
      .eq("id", bid)
      .eq("business_profile_id", businessProfileId)
      .maybeSingle();

    const { data: profs, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, is_active")
      .eq("business_profile_id", businessProfileId)
      .eq("building_id", bid)
      .order("full_name");

    const { data: unitsData, error: uErr } = await supabase
      .from("units")
      .select("id, unit_number, floor_number, monthly_fee")
      .eq("building_id", bid)
      .eq("business_profile_id", businessProfileId)
      .order("unit_number");

    setLoading(false);

    if (bErr || !building) {
      setErr(bErr?.message ?? "בניין לא נמצא");
      return;
    }
    if (pErr) {
      setErr(pErr.message);
      return;
    }
    if (uErr) {
      setErr(uErr.message);
      return;
    }

    setAddress(building.address ?? "");
    setCity(building.city ?? "");
    setProfiles((profs ?? []) as ProfileRow[]);
    setUnits((unitsData ?? []) as UnitRow[]);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onInvite() {
    if (!id) return;
    const bid = Array.isArray(id) ? id[0] : id;
    setSaving(true);
    const result = await inviteResidentToBuildingViaWebApi(bid, {
      full_name: fullName.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      Alert.alert("שגיאה", result.error);
      return;
    }
    setFullName("");
    setEmail("");
    setPassword("");
    setPhone("");
    void load();
    Alert.alert("הצלחה", "המשתמש נוצר ושויך לבניין.");
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
    <ScrollView className="flex-1 bg-white px-4 pt-4">
      <Text className="mb-1 text-xl font-bold">
        {address.trim() || "—"}
      </Text>
      <Text className="mb-6 text-sm text-gray-600">{city.trim() || "—"}</Text>

      <Text className="mb-2 font-semibold text-slate-800">
        משתמשים משויכים לבניין
      </Text>
      {profiles.length === 0 ? (
        <Text className="mb-6 text-gray-500">
          אין עדיין פרופילים עם שיוך לבניין זה.
        </Text>
      ) : (
        <View className="mb-6 gap-2">
          {profiles.map((p) => (
            <View
              key={p.id}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <Text className="font-medium">{p.full_name}</Text>
              <Text className="text-sm text-gray-600">
                {p.phone ?? "—"} · {p.role}
                {p.is_active === false ? " · לא פעיל" : ""}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text className="mb-2 font-semibold text-slate-800">הוספת דייר</Text>
      <Text className="mb-3 text-sm text-gray-600">
        נדרש שרת Next עם SUPABASE_SERVICE_ROLE_KEY ו־EXPO_PUBLIC_WEB_APP_ORIGIN.
      </Text>
      <TextInput
        className="mb-2 rounded-lg border border-gray-300 px-3 py-2 text-left"
        placeholder="שם מלא"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        className="mb-2 rounded-lg border border-gray-300 px-3 py-2 text-left"
        placeholder="אימייל"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="mb-2 rounded-lg border border-gray-300 px-3 py-2 text-left"
        placeholder="סיסמה ראשונית"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        className="mb-4 rounded-lg border border-gray-300 px-3 py-2 text-left"
        placeholder="טלפון (אופציונלי)"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <Pressable
        className="mb-8 rounded-lg bg-blue-600 py-3 disabled:opacity-50"
        disabled={
          saving ||
          !fullName.trim() ||
          !email.trim() ||
          password.length < 6
        }
        onPress={() => void onInvite()}
      >
        <Text className="text-center font-semibold text-white">
          {saving ? "יוצר…" : "הוספת דייר"}
        </Text>
      </Pressable>

      <Text className="mb-2 font-semibold text-slate-800">דירות</Text>
      {units.length === 0 ? (
        <Text className="pb-8 text-gray-500">אין דירות רשומות.</Text>
      ) : (
        <View className="gap-2 pb-8">
          {units.map((u) => (
            <View
              key={u.id}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <Text className="font-medium">דירה {u.unit_number}</Text>
              {u.floor_number != null ? (
                <Text className="text-sm text-gray-600">
                  קומה {u.floor_number}
                </Text>
              ) : null}
              {u.monthly_fee != null ? (
                <Text className="text-sm text-gray-600">
                  דמי ניהול: {u.monthly_fee}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
