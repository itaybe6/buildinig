import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";

export default function ResidentAnnouncementsScreen() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<
    { id: string; title: string; body: string; created_at: string | null }[]
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

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!profile) {
          setErr("לא נמצא פרופיל");
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

        const { data: ur } = await supabase
          .from("unit_residents")
          .select("unit_id")
          .eq("profile_id", profile.id)
          .eq("status", "active");

        const unitIds = (ur ?? []).map((r) => r.unit_id);
        if (unitIds.length === 0) {
          if (!cancelled) setItems([]);
          return;
        }

        const { data: unitsData } = await supabase
          .from("units")
          .select("building_id")
          .in("id", unitIds);

        const buildingIds = [
          ...new Set((unitsData ?? []).map((u) => u.building_id)),
        ];
        if (buildingIds.length === 0) {
          if (!cancelled) setItems([]);
          return;
        }

        const { data: ann } = await supabase
          .from("announcements")
          .select("id, title, body, created_at")
          .eq("business_profile_id", businessProfileId)
          .in("building_id", buildingIds)
          .order("created_at", { ascending: false })
          .limit(50);

        if (!cancelled) setItems(ann ?? []);
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
      <Text className="mb-4 text-xl font-bold">מודעות הבניין</Text>
      {items.length === 0 ? (
        <Text className="text-gray-500">אין מודעות להצגה.</Text>
      ) : (
        <View className="gap-4 pb-8">
          {items.map((a) => (
            <View
              key={a.id}
              className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm"
            >
              <Text className="mb-1 text-lg font-semibold">{a.title}</Text>
              {a.created_at ? (
                <Text className="mb-2 text-xs text-gray-500">
                  {new Date(a.created_at).toLocaleString("he-IL")}
                </Text>
              ) : null}
              <Text className="text-base leading-6 text-slate-800">{a.body}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
