import { formatILS, QUOTE_STATUS_LABEL } from "@my-project/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";

export default function ResidentQuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [row, setRow] = useState<{
    title: string;
    description: string | null;
    status: keyof typeof QUOTE_STATUS_LABEL;
    preferred_date: string | null;
    created_at: string | null;
    image_urls: string[] | null;
    resident_proposed_amount: string | null;
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
          .from("quote_requests")
          .select(
            "title, description, status, preferred_date, created_at, requested_by, image_urls, resident_proposed_amount"
          )
          .eq("id", String(id))
          .eq("business_profile_id", businessProfileId)
          .maybeSingle();

        if (error) {
          setErr(error.message);
          return;
        }
        if (!data || data.requested_by !== profile.id) {
          setErr("אין הרשאה לצפות בבקשה זו");
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

  const imgs = row.image_urls ?? [];

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-4">
      <Text className="mb-2 text-2xl font-bold">{row.title}</Text>
      <Text className="mb-4 text-sm text-gray-600">
        {QUOTE_STATUS_LABEL[row.status]}
        {row.preferred_date
          ? ` · תאריך מועדף: ${new Date(row.preferred_date).toLocaleDateString("he-IL")}`
          : ""}
      </Text>
      {row.created_at ? (
        <Text className="mb-4 text-xs text-gray-400">
          נוצר: {new Date(row.created_at).toLocaleString("he-IL")}
        </Text>
      ) : null}
      {row.resident_proposed_amount != null &&
      String(row.resident_proposed_amount).trim() !== "" ? (
        <Text className="mb-4 text-base font-medium">
          מחיר מוצע: {formatILS(row.resident_proposed_amount)}
        </Text>
      ) : null}
      {row.description ? (
        <Text className="mb-4 text-base leading-7">{row.description}</Text>
      ) : (
        <Text className="mb-4 text-gray-500">אין תיאור נוסף.</Text>
      )}
      {imgs.length > 0 ? (
        <View className="mb-8 gap-3">
          <Text className="mb-2 font-medium text-slate-800">תמונות</Text>
          <View className="flex-row flex-wrap gap-3">
            {imgs.map((url) => (
              <Pressable key={url} onPress={() => Linking.openURL(url)}>
                <Image
                  source={{ uri: url }}
                  className="h-28 w-28 rounded-lg bg-slate-100"
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
