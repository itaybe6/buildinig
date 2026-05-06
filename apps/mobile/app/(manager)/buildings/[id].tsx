import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";

export default function ManagerBuildingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [units, setUnits] = useState<
    { id: string; unit_number: string; monthly_fee: string | null }[]
  >([]);

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

        const { data: building, error: bErr } = await supabase
          .from("buildings")
          .select("address, city")
          .eq("id", String(id))
          .eq("business_profile_id", businessProfileId)
          .maybeSingle();

        if (bErr) {
          setErr(bErr.message);
          return;
        }
        if (!building) {
          setErr("בניין לא נמצא");
          return;
        }

        const { data: unitsData } = await supabase
          .from("units")
          .select("id, unit_number, monthly_fee")
          .eq("building_id", String(id))
          .eq("business_profile_id", businessProfileId)
          .order("unit_number");

        if (!cancelled) {
          setAddress(building.address ?? "");
          setCity(building.city ?? "");
          setUnits(unitsData ?? []);
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
  }, [id]);

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
      <Text className="mb-2 font-semibold text-slate-800">דירות</Text>
      {units.length === 0 ? (
        <Text className="text-gray-500">אין דירות רשומות.</Text>
      ) : (
        <View className="gap-2 pb-8">
          {units.map((u) => (
            <View
              key={u.id}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <Text className="font-medium">דירה {u.unit_number}</Text>
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
