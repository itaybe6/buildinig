import { REQUEST_STATUS_LABEL } from "@my-project/shared";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { resolveTenantIdForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";

export default function ResidentRequestsListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<
    { id: string; title: string; status: string; created_at: string | null }[]
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
          setErr("חסר מזהה ארגון");
          return;
        }

        const { data } = await supabase
          .from("service_requests")
          .select("id, title, status, created_at")
          .eq("tenant_id", tenantId)
          .eq("reported_by", profile.id)
          .order("created_at", { ascending: false })
          .limit(80);

        if (!cancelled) setRows(data ?? []);
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
      <Text className="mb-4 text-xl font-bold">הקריאות שלי</Text>
      {rows.length === 0 ? (
        <Text className="text-gray-500">אין קריאות שירות.</Text>
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
