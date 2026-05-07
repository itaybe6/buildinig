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
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";

export default function ManagerServiceRequestDetailScreen() {
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
    internal_notes: string | null;
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
          .from("service_requests")
          .select(
            "title, description, category, status, priority, internal_notes, created_at, buildings!inner(business_profile_id)"
          )
          .eq("id", String(id))
          .eq("buildings.business_profile_id", businessProfileId)
          .maybeSingle();

        if (error) {
          setErr(error.message);
          return;
        }
        if (!data) {
          setErr("הקריאה לא נמצאה");
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
        <Text className="mb-6 text-base leading-7">{row.description}</Text>
      ) : null}
      {row.internal_notes ? (
        <View className="rounded-lg bg-amber-50 p-3">
          <Text className="mb-1 text-sm font-semibold text-amber-900">
            הערות פנימיות
          </Text>
          <Text className="text-base leading-7 text-amber-950">
            {row.internal_notes}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
