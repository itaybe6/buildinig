import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

type TenantRow = {
  id: string;
  name: string;
  is_active: boolean | null;
};

export default function SuperAdminTenantsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<
    { tenant: TenantRow; managers: string[] }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: tenants, error: te } = await supabase
      .from("tenants")
      .select("id, name, is_active")
      .order("name");

    const { data: managers, error: me } = await supabase
      .from("profiles")
      .select("tenant_id, full_name")
      .eq("role", "manager")
      .not("tenant_id", "is", null);

    setLoading(false);

    if (te || me) {
      setError(te?.message ?? me?.message ?? "שגיאה");
      return;
    }

    const map = new Map<string, string[]>();
    for (const m of managers ?? []) {
      if (!m.tenant_id) continue;
      const list = map.get(m.tenant_id) ?? [];
      list.push(m.full_name);
      map.set(m.tenant_id, list);
    }

    setRows(
      (tenants ?? []).map((t) => ({
        tenant: t as TenantRow,
        managers: map.get(t.id) ?? [],
      }))
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-3 pt-2">
      {error ? <Text className="mb-2 text-red-600">{error}</Text> : null}
      <FlatList
        data={rows}
        keyExtractor={(item) => item.tenant.id}
        ListEmptyComponent={
          <Text className="py-8 text-center text-gray-500">
            אין חברות ניהול להצגה
          </Text>
        }
        renderItem={({ item }) => (
          <View className="mb-3 rounded-xl border border-gray-200 p-4">
            <Text className="text-lg font-semibold">{item.tenant.name}</Text>
            <Text className="mt-1 text-sm text-gray-600">
              מנהלים:{" "}
              {item.managers.length ? item.managers.join(", ") : "—"}
            </Text>
            <Text className="mt-1 text-sm text-gray-600">
              סטטוס:{" "}
              {item.tenant.is_active === false ? (
                <Text className="text-amber-700">לא פעיל</Text>
              ) : (
                <Text className="text-green-700">פעיל</Text>
              )}
            </Text>
            <Pressable
              className="mt-3 rounded-lg bg-blue-600 px-3 py-2 active:opacity-90"
              onPress={() =>
                router.push(`/tenants/${item.tenant.id}/buildings`)
              }
            >
              <Text className="text-center font-semibold text-white">
                בניינים
              </Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
