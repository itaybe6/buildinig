import {
  REQUEST_CATEGORY_LABEL,
  REQUEST_PRIORITY_LABEL,
  REQUEST_STATUS_LABEL,
} from "@my-project/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function ResidentRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [row, setRow] = useState<{
    title: string;
    description: string | null;
    category: keyof typeof REQUEST_CATEGORY_LABEL;
    status: keyof typeof REQUEST_STATUS_LABEL;
    priority: keyof typeof REQUEST_PRIORITY_LABEL;
    created_at: string | null;
  } | null>(null);

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

        const { data, error } = await supabase
          .from("service_requests")
          .select(
            "title, description, category, status, priority, created_at, reported_by"
          )
          .eq("id", String(id))
          .eq("tenant_id", tenantId)
          .maybeSingle();

        if (error) {
          setErr(error.message);
          return;
        }
        if (!data || data.reported_by !== profile.id) {
          setErr("אין הרשאה לצפות בקריאה זו");
          return;
        }

        if (!cancelled) setRow(data);
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

  if (err || !row) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="mb-4 text-center text-red-600">{err ?? "לא נמצא"}</Text>
        <Pressable
          onPress={() => router.back()}
          className="rounded-lg bg-slate-200 px-4 py-2"
        >
          <Text>חזרה</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-4">
      <Text className="mb-2 text-2xl font-bold">{row.title}</Text>
      <Text className="mb-4 text-sm text-gray-600">
        {REQUEST_CATEGORY_LABEL[row.category]} ·{" "}
        {REQUEST_PRIORITY_LABEL[row.priority]} ·{" "}
        {REQUEST_STATUS_LABEL[row.status]}
      </Text>
      {row.created_at ? (
        <Text className="mb-4 text-xs text-gray-400">
          נוצר: {new Date(row.created_at).toLocaleString("he-IL")}
        </Text>
      ) : null}
      {row.description ? (
        <Text className="text-base leading-7">{row.description}</Text>
      ) : (
        <Text className="text-gray-500">אין תיאור נוסף.</Text>
      )}
    </ScrollView>
  );
}
