import { createServiceTypeViaWebApi } from "@/lib/create-service-type-via-web-api";
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  name: string;
  description: string | null;
  price_min: string | null;
  price_max: string | null;
  is_active: boolean | null;
};

export default function ManagerServiceTypesScreen() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    setErr(null);
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
        .from("service_types")
        .select("id, name, description, price_min, price_max, is_active")
        .eq("business_profile_id", businessProfileId)
        .order("name");

      if (error) {
        setErr(error.message);
        return;
      }
      setRows((data ?? []) as Row[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setName("");
    setDescription("");
    setPriceMin("");
    setPriceMax("");
    setIsActive(true);
    setFormErr(null);
  }

  async function onSubmitAdd() {
    const n = name.trim();
    if (!n) {
      setFormErr("חובה שם לשירות.");
      return;
    }

    setSaving(true);
    setFormErr(null);
    const result = await createServiceTypeViaWebApi({
      name: n,
      description: description.trim() || null,
      price_min: priceMin.trim() || null,
      price_max: priceMax.trim() || null,
      is_active: isActive,
    });
    setSaving(false);

    if (!result.ok) {
      setFormErr(result.error);
      return;
    }

    setAddOpen(false);
    resetForm();
    setLoading(true);
    await load();
  }

  if (loading && rows.length === 0 && !err) {
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
            סוגי שירות לארגון. הוספה מהאפליקציה דורשת{" "}
            <Text className="font-medium">EXPO_PUBLIC_WEB_APP_ORIGIN</Text>{" "}
            מצביע לשרת הווב.
          </Text>
          <Pressable
            className="min-h-[44px] shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5"
            onPress={() => {
              resetForm();
              setAddOpen(true);
            }}
          >
            <Text className="text-center text-sm font-semibold text-white">
              הוספה
            </Text>
          </Pressable>
        </View>

        {rows.length === 0 ? (
          <Text className="text-gray-500">אין סוגי שירות.</Text>
        ) : (
          <View className="gap-2 pb-8">
            {rows.map((r) => (
              <View
                key={r.id}
                className="rounded-lg border border-slate-200 px-3 py-3"
              >
                <Text className="font-semibold">{r.name}</Text>
                <Text className="text-sm text-gray-600">
                  {r.is_active ? "פעיל" : "לא פעיל"}
                </Text>
                {r.description ? (
                  <Text className="mt-2 text-sm leading-6">{r.description}</Text>
                ) : null}
                <Text className="mt-1 text-xs text-gray-500">
                  טווח מחיר: {r.price_min ?? "—"} – {r.price_max ?? "—"}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

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
              <Text className="mb-1 text-lg font-bold">סוג שירות חדש</Text>
              <Text className="mb-4 text-sm text-gray-600">
                שם, תיאור, טווח מחיר וסטטוס פעיל.
              </Text>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                className="max-h-[70%]"
              >
                <Text className="mb-1 text-xs font-medium text-gray-700">
                  שם שירות
                </Text>
                <TextInput
                  className="mb-3 min-h-[44px] rounded-lg border border-gray-300 px-3 py-2.5 text-right"
                  placeholder="שם"
                  value={name}
                  onChangeText={setName}
                />

                <Text className="mb-1 text-xs font-medium text-gray-700">
                  תיאור (אופציונלי)
                </Text>
                <TextInput
                  className="mb-3 min-h-[88px] rounded-lg border border-gray-300 px-3 py-2.5 text-right align-top"
                  placeholder="תיאור"
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />

                <Text className="mb-1 text-xs font-medium text-gray-700">
                  מחיר מינימום / מקסימום
                </Text>
                <View className="mb-3 flex-row gap-2">
                  <TextInput
                    className="min-h-[44px] flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-left"
                    placeholder="מינ׳"
                    keyboardType="decimal-pad"
                    value={priceMin}
                    onChangeText={setPriceMin}
                  />
                  <TextInput
                    className="min-h-[44px] flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-left"
                    placeholder="מקס׳"
                    keyboardType="decimal-pad"
                    value={priceMax}
                    onChangeText={setPriceMax}
                  />
                </View>

                <Pressable
                  className="mb-3 flex-row items-center gap-2"
                  onPress={() => setIsActive(!isActive)}
                >
                  <View
                    className={`h-5 w-5 rounded border ${isActive ? "border-blue-600 bg-blue-600" : "border-gray-400"}`}
                  />
                  <Text className="text-sm text-gray-800">פעיל</Text>
                </Pressable>

                {formErr ? (
                  <Text className="mb-3 text-sm text-red-600">{formErr}</Text>
                ) : null}
              </ScrollView>

              <Pressable
                className="mt-2 min-h-[48px] items-center justify-center rounded-lg bg-blue-600 py-3.5 disabled:opacity-50"
                disabled={saving || !name.trim()}
                onPress={() => void onSubmitAdd()}
              >
                <Text className="text-center font-semibold text-white">
                  {saving ? "שומר…" : "שמירה"}
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
