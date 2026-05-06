import { supabase } from "@/lib/supabase";
import { Link } from "expo-router";

export const options = {
  title: "סקירת עסק",
  drawerLabel: "סקירת עסק",
};
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function SuperAdminDashboardScreen() {
  const [counts, setCounts] = useState<{
    tenants: number | null;
    managers: number | null;
    buildings: number | null;
    requests: number | null;
    activeTenants: number | null;
  }>({
    tenants: null,
    managers: null,
    buildings: null,
    requests: null,
    activeTenants: null,
  });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [
      tenantsRes,
      managersRes,
      buildingsRes,
      requestsRes,
      activeTenantsRes,
    ] = await Promise.all([
      supabase.from("tenants").select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "manager"),
      supabase.from("buildings").select("id", { count: "exact", head: true }),
      supabase
        .from("service_requests")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("tenants")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
    ]);

    const err =
      tenantsRes.error ||
      managersRes.error ||
      buildingsRes.error ||
      requestsRes.error ||
      activeTenantsRes.error;
    if (err) {
      setError(err.message);
      return;
    }

    setCounts({
      tenants: tenantsRes.count,
      managers: managersRes.count,
      buildings: buildingsRes.count,
      requests: requestsRes.count,
      activeTenants: activeTenantsRes.count,
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items: { label: string; value: number | null; hint: string }[] = [
    { label: "חברות ניהול", value: counts.tenants, hint: "לקוחות" },
    { label: "מנהלים", value: counts.managers, hint: "משתמשי מנהל" },
    { label: "בניינים", value: counts.buildings, hint: "בכל הלקוחות" },
    { label: "קריאות שירות", value: counts.requests, hint: "במערכת" },
    { label: "לקוחות פעילים", value: counts.activeTenants, hint: "חברות פעילות" },
  ];

  return (
    <ScrollView className="flex-1 bg-white px-4 py-4">
      <Text className="mb-1 text-2xl font-bold">סקירת עסק</Text>
      <Text className="mb-6 text-gray-600">
        תמונה ברמת הפלטפורמה — כל הלקוחות והנכסים.
      </Text>

      {error ? (
        <Text className="mb-4 text-red-600">{error}</Text>
      ) : null}

      <View className="mb-6 gap-3">
        {items.map((row) => (
          <View
            key={row.label}
            className="rounded-xl border border-gray-200 bg-gray-50 p-4"
          >
            <Text className="text-base font-medium text-gray-800">{row.label}</Text>
            <Text className="mt-1 text-3xl font-semibold tabular-nums">
              {row.value ?? "—"}
            </Text>
            <Text className="mt-1 text-xs text-gray-500">{row.hint}</Text>
          </View>
        ))}
      </View>

      <Link href="/tenants" asChild>
        <Pressable className="rounded-lg bg-blue-600 px-4 py-3 active:opacity-90">
          <Text className="text-center font-semibold text-white">
            ניהול לקוחות ובניינים
          </Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}
