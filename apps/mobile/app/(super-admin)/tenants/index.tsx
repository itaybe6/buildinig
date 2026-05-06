import { supabase } from "@/lib/supabase";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

type BusinessProfileListRow = {
  id: string;
  name: string;
  contact_email: string | null;
  is_active: boolean | null;
  legal_name: string | null;
};

type Row = {
  tenant: BusinessProfileListRow;
  managers: string[];
  legalName: string | null;
};

type OrphanRow = {
  id: string;
  full_name: string;
  phone: string | null;
  created_at: string | null;
};

export default function SuperAdminTenantsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [orphans, setOrphans] = useState<OrphanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: tenants, error: te } = await supabase
      .from("business_profiles")
      .select("id, name, contact_email, is_active, legal_name")
      .order("name");

    const { data: managers, error: me } = await supabase
      .from("profiles")
      .select("tenant_id, full_name")
      .eq("role", "manager")
      .not("tenant_id", "is", null);

    const { data: orphanList, error: oe } = await supabase
      .from("profiles")
      .select("id, full_name, phone, created_at")
      .eq("role", "manager")
      .is("tenant_id", null)
      .order("created_at", { ascending: false });

    setLoading(false);

    if (te || me || oe) {
      setError(te?.message ?? me?.message ?? oe?.message ?? "שגיאה");
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
      (tenants ?? []).map((t) => {
        const tr = t as BusinessProfileListRow;
        return {
          tenant: tr,
          managers: map.get(t.id) ?? [],
          legalName: tr.legal_name,
        };
      })
    );
    setOrphans((orphanList ?? []) as OrphanRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const header = (
    <View className="pb-2">
      <Text className="mb-2 px-1 text-base text-gray-700">
        כל עסק הוא רשומת{" "}
        <Text className="font-mono text-xs">business_profiles</Text>. מנהל צריך{" "}
        <Text className="font-mono text-xs">tenant_id</Text> לאותו מזהה.
      </Text>

      <View className="px-1">
        <Link href="/(super-admin)/tenants/new" asChild>
          <Pressable className="rounded-xl bg-blue-600 px-4 py-3.5 active:opacity-90">
            <Text className="text-center text-base font-semibold text-white">
              הוספת לקוח חדש
            </Text>
          </Pressable>
        </Link>
      </View>

      {error ? (
        <Text className="mb-2 px-1 text-red-600">{error}</Text>
      ) : null}

      {orphans.length > 0 ? (
        <View className="mx-1 mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <Text className="mb-2 font-semibold text-amber-950">
            מנהלים ללא עסק משויך
          </Text>
          {orphans.map((o) => (
            <Text key={o.id} className="mb-1 text-sm text-amber-900">
              · {o.full_name}
              {o.phone ? ` — ${o.phone}` : ""}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
      data={rows}
      keyExtractor={(item) => item.tenant.id}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <Text className="py-8 text-center text-gray-500">
          אין חברות ניהול — השתמשו בכפתור "הוספת לקוח חדש" למעלה
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable
          className="mb-3 rounded-xl border border-gray-200 bg-white p-4 active:bg-gray-50"
          onPress={() =>
            router.push(`/(super-admin)/tenants/${item.tenant.id}`)
          }
        >
          <Text className="text-lg font-semibold">{item.tenant.name}</Text>
          {item.legalName ? (
            <Text className="mt-1 text-sm text-gray-600">
              שם משפטי: {item.legalName}
            </Text>
          ) : null}
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
          <Text className="mt-3 text-center text-sm font-semibold text-blue-600">
            לחצו לפרטי עסק ובניינים
          </Text>
        </Pressable>
      )}
    />
  );
}
