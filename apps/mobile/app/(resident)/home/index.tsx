import {
  REQUEST_STATUS_LABEL,
} from "@my-project/shared";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";
import { resolveTenantIdForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";

export default function ResidentHomeScreen() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pinned, setPinned] = useState<{ id: string; title: string }[]>([]);
  const [openReqs, setOpenReqs] = useState<
    { id: string; title: string; status: string }[]
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

        const tenantId = await resolveTenantIdForUser(supabase, user.id);
        if (!tenantId) {
          setErr("חסר מזהה ארגון (tenant)");
          return;
        }

        const { data: ur } = await supabase
          .from("unit_residents")
          .select("unit_id")
          .eq("profile_id", profile.id)
          .eq("status", "active");

        const unitIds = (ur ?? []).map((r) => r.unit_id);
        let buildingIds: string[] = [];
        if (unitIds.length > 0) {
          const { data: unitsData } = await supabase
            .from("units")
            .select("building_id")
            .in("id", unitIds);
          buildingIds = [
            ...new Set((unitsData ?? []).map((u) => u.building_id)),
          ];
        }

        if (buildingIds.length > 0) {
          const { data: ann } = await supabase
            .from("announcements")
            .select("id, title")
            .eq("tenant_id", tenantId)
            .eq("is_pinned", true)
            .in("building_id", buildingIds)
            .order("created_at", { ascending: false })
            .limit(8);
          if (!cancelled) setPinned(ann ?? []);
        } else if (!cancelled) {
          setPinned([]);
        }

        const { data: reqs } = await supabase
          .from("service_requests")
          .select("id, title, status")
          .eq("tenant_id", tenantId)
          .eq("reported_by", profile.id)
          .in("status", ["open", "assigned", "in_progress"])
          .order("created_at", { ascending: false })
          .limit(8);

        if (!cancelled) setOpenReqs(reqs ?? []);
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
        <Text className="mt-2 text-gray-500">טוען…</Text>
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
      <Text className="mb-4 text-xl font-bold">בית</Text>

      <Text className="mb-2 font-semibold text-slate-800">מודעות נעוצות</Text>
      {pinned.length === 0 ? (
        <Text className="mb-6 text-gray-500">אין מודעות נעוצות.</Text>
      ) : (
        <View className="mb-6 gap-2">
          {pinned.map((a) => (
            <View
              key={a.id}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <Text className="font-medium">{a.title}</Text>
            </View>
          ))}
        </View>
      )}

      <Text className="mb-2 font-semibold text-slate-800">קריאות פתוחות</Text>
      {openReqs.length === 0 ? (
        <Text className="text-gray-500">אין קריאות פתוחות.</Text>
      ) : (
        <View className="gap-2 pb-8">
          {openReqs.map((r) => (
            <View
              key={r.id}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <Text className="font-medium">{r.title}</Text>
              <Text className="text-sm text-gray-600">
                {REQUEST_STATUS_LABEL[r.status as keyof typeof REQUEST_STATUS_LABEL] ??
                  r.status}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
