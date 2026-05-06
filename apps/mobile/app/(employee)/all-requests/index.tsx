import {
  REQUEST_CATEGORY_LABEL,
  REQUEST_STATUS_LABEL,
} from "@my-project/shared";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";

export default function EmployeeAllRequestsScreen() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<
    {
      id: string;
      title: string;
      status: string;
      category: string;
      buildings: unknown;
    }[]
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

        const { data } = await supabase
          .from("service_requests")
          .select("id, title, status, category, buildings ( address )")
          .eq("business_profile_id", businessProfileId)
          .order("created_at", { ascending: false })
          .limit(120);

        if (!cancelled) setRows((data ?? []) as typeof rows);
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
      <Text className="mb-4 text-xl font-bold">כל קריאות הבניין</Text>
      {rows.length === 0 ? (
        <Text className="text-gray-500">אין קריאות בארגון.</Text>
      ) : (
        <View className="gap-2 pb-8">
          {rows.map((r) => {
            const b = r.buildings as unknown as { address: string } | null;
            return (
              <View
                key={r.id}
                className="rounded-lg border border-slate-200 px-3 py-3"
              >
                <Text className="font-semibold">{r.title}</Text>
                <Text className="text-sm text-gray-600">
                  {b?.address ?? "בניין"} ·{" "}
                  {REQUEST_CATEGORY_LABEL[
                    r.category as keyof typeof REQUEST_CATEGORY_LABEL
                  ] ?? r.category}{" "}
                  ·{" "}
                  {REQUEST_STATUS_LABEL[
                    r.status as keyof typeof REQUEST_STATUS_LABEL
                  ] ?? r.status}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
