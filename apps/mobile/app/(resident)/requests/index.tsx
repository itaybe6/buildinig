import {
  REQUEST_STATUS_LABEL,
} from "@my-project/shared";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { getResidentBuildingOptions } from "@/lib/resident-building-options";
import { supabase } from "@/lib/supabase";

export default function ResidentAnnouncementsAndRequestsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<
    { id: string; title: string; body: string; created_at: string | null }[]
  >([]);
  const [rows, setRows] = useState<
    { id: string; title: string; status: string; created_at: string | null }[]
  >([]);
  const [canPost, setCanPost] = useState(false);

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

      const buildings = await getResidentBuildingOptions(supabase, {
        profileId: profile.id,
        businessProfileId,
      });
      setCanPost(buildings.length > 0);

      const [annRes, reqRes] = await Promise.all([
        supabase
          .from("announcements")
          .select("id, title, body, created_at, buildings!inner(business_profile_id)")
          .eq("buildings.business_profile_id", businessProfileId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("service_requests")
          .select("id, title, status, created_at, buildings!inner(business_profile_id)")
          .eq("buildings.business_profile_id", businessProfileId)
          .order("created_at", { ascending: false })
          .limit(80),
      ]);

      if (annRes.error) {
        setErr(annRes.error.message);
        return;
      }
      if (reqRes.error) {
        setErr(reqRes.error.message);
        return;
      }

      setAnnouncements(annRes.data ?? []);
      setRows(reqRes.data ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
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

  if (err) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-center text-red-600">{err}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-4">
      <Text className="mb-2 text-xl font-bold">בית</Text>
      <Text className="mb-4 text-sm text-gray-600">
        מודעות מהבניין וקריאות שירות של כל הדיירים בבניינים שלך.
      </Text>

      {canPost ? (
        <View className="mb-6 flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => router.push("/(resident)/requests/new-announcement")}
            className="rounded-lg bg-slate-900 px-4 py-2.5 active:opacity-90"
          >
            <Text className="text-center text-sm font-semibold text-white">
              מודעה חדשה
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(resident)/requests/new")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 active:bg-slate-50"
          >
            <Text className="text-center text-sm font-semibold text-slate-900">
              קריאה חדשה
            </Text>
          </Pressable>
        </View>
      ) : (
        <Text className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          אין דירה משויכת לפרופיל — לא ניתן לפרסם או לפתוח קריאה. פנה למנהל
          הנכס.
        </Text>
      )}

      <Text className="mb-2 text-lg font-semibold">מודעות</Text>
      {announcements.length === 0 ? (
        <Text className="mb-6 text-gray-500">אין מודעות להצגה.</Text>
      ) : (
        <View className="mb-8 gap-4">
          {announcements.map((a) => (
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

      <Text className="mb-2 text-lg font-semibold">קריאות שירות בבניין</Text>
      {rows.length === 0 ? (
        <Text className="mb-8 text-gray-500">אין קריאות שירות.</Text>
      ) : (
        <View className="gap-2 pb-8">
          {rows.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => router.push(`/(resident)/requests/${r.id}`)}
              className="rounded-lg border border-slate-200 px-3 py-3 active:bg-slate-50"
            >
              <Text className="font-semibold">{r.title}</Text>
              <Text className="text-sm text-gray-600">
                {REQUEST_STATUS_LABEL[
                  r.status as keyof typeof REQUEST_STATUS_LABEL
                ] ?? r.status}
              </Text>
              {r.created_at ? (
                <Text className="mt-1 text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleString("he-IL")}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
