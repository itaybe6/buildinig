import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { countUnitsByBuildingId } from "@/lib/building-unit-helpers";
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";

export default function ManagerBuildingsListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<
    {
      id: string;
      address: string | null;
      city: string | null;
      floors_count: number | null;
      is_active: boolean | null;
    }[]
  >([]);
  const [unitCountByBuilding, setUnitCountByBuilding] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
          .from("buildings")
          .select("id, address, city, floors_count, is_active")
          .eq("business_profile_id", businessProfileId)
          .order("address");

        if (error) {
          setErr(error.message);
          return;
        }

        const list = data ?? [];
        const ids = list.map((b) => b.id);
        let counts: Record<string, number> = {};
        if (ids.length > 0) {
          const { data: urows, error: ue } = await supabase
            .from("units")
            .select("building_id")
            .in("building_id", ids);
          if (ue) {
            setErr(ue.message);
            return;
          }
          const m = countUnitsByBuildingId(urows ?? []);
          counts = Object.fromEntries(m);
        }

        if (!cancelled) {
          setRows(list);
          setUnitCountByBuilding(counts);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "שגיאה");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      {rows.length === 0 ? (
        <Text className="text-gray-500">אין בניינים בארגון.</Text>
      ) : (
        <View className="gap-2 pb-8">
          {rows.map((r) => (
            <Pressable
              key={r.id}
              onPress={() =>
                router.push(`/(manager)/buildings/${r.id}` as never)
              }
              className="rounded-lg border border-slate-200 px-3 py-3 active:bg-slate-50"
            >
              <Text className="font-semibold">
                {r.address?.trim() || "—"}
              </Text>
              <Text className="text-sm text-gray-600">
                {r.city?.trim() || "—"}
              </Text>
              <Text className="mt-1 text-xs text-gray-400">
                קומות: {r.floors_count ?? "—"} · דירות:{" "}
                {unitCountByBuilding[r.id] ?? 0} ·{" "}
                {r.is_active ? "פעיל" : "לא פעיל"}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
