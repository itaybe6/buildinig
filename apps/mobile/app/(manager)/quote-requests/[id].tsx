import { formatILS, QUOTE_STATUS_LABEL } from "@my-project/shared";
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

export default function ManagerQuoteRequestDetailScreen() {
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
    resident_proposed_amount: string | null;
    buildings: unknown;
    units: unknown;
    service_types: unknown;
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
          .from("quote_requests")
          .select(
            `
            title,
            description,
            status,
            preferred_date,
            created_at,
            resident_proposed_amount,
            buildings ( address, city ),
            units ( unit_number ),
            service_types ( name, description )
          `
          )
          .eq("id", String(id))
          .eq("business_profile_id", businessProfileId)
          .maybeSingle();

        if (error) {
          setErr(error.message);
          return;
        }
        if (!data) {
          setErr("הבקשה לא נמצאה");
          return;
        }

        if (!cancelled) setRow(data as typeof row);
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

  const b = row.buildings as unknown as {
    address: string | null;
    city: string | null;
  } | null;
  const u = row.units as unknown as { unit_number: string } | null;
  const st = row.service_types as unknown as {
    name: string;
    description: string | null;
  } | null;

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-4">
      <Text className="mb-2 text-2xl font-bold">{row.title}</Text>
      <Text className="mb-4 text-sm text-gray-600">
        {QUOTE_STATUS_LABEL[row.status]}
      </Text>
      {b ? (
        <Text className="mb-2 text-sm text-gray-700">
          {[b.address, b.city].filter(Boolean).join(", ") || "—"}
        </Text>
      ) : null}
      {u ? (
        <Text className="mb-2 text-sm text-gray-700">
          דירה {u.unit_number}
        </Text>
      ) : null}
      {st ? (
        <Text className="mb-4 text-sm text-gray-700">
          שירות: {st.name}
          {st.description ? ` — ${st.description}` : ""}
        </Text>
      ) : null}
      {row.resident_proposed_amount != null &&
      String(row.resident_proposed_amount).trim() !== "" ? (
        <Text className="mb-4 text-sm font-medium text-gray-800">
          מחיר מוצע על ידי הדייר:{" "}
          {formatILS(row.resident_proposed_amount)}
        </Text>
      ) : null}
      {row.preferred_date ? (
        <Text className="mb-2 text-xs text-gray-500">
          תאריך מועדף:{" "}
          {new Date(row.preferred_date).toLocaleDateString("he-IL")}
        </Text>
      ) : null}
      {row.created_at ? (
        <Text className="mb-4 text-xs text-gray-400">
          נוצר: {new Date(row.created_at).toLocaleString("he-IL")}
        </Text>
      ) : null}
      {row.description ? (
        <Text className="text-base leading-7">{row.description}</Text>
      ) : null}
    </ScrollView>
  );
}
