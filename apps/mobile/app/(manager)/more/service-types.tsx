import { REQUEST_CATEGORY_LABEL } from "@my-project/shared";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";
import { resolveTenantIdForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";

export default function ManagerServiceTypesScreen() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<
    {
      id: string;
      name: string;
      description: string | null;
      category: string;
      price_min: string | null;
      price_max: string | null;
      is_active: boolean | null;
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

        const tenantId = await resolveTenantIdForUser(supabase, user.id);
        if (!tenantId) {
          setErr("חסר מזהה ארגון");
          return;
        }

        const { data, error } = await supabase
          .from("service_types")
          .select(
            "id, name, description, category, price_min, price_max, is_active"
          )
          .eq("tenant_id", tenantId)
          .order("name");

        if (error) {
          setErr(error.message);
          return;
        }
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
      {rows.length === 0 ? (
        <Text className="text-gray-500">אין סוגי שירות.</Text>
      ) : (
        <View className="gap-2 pb-8">
          {rows.map((r) => (
            <View
              key={r.id}
              className="rounded-lg border border-slate-200 px-3 py-3"
            >
              <Text className="font-semibold">{r.name}</Text>
              <Text className="text-sm text-gray-600">
                {REQUEST_CATEGORY_LABEL[
                  r.category as keyof typeof REQUEST_CATEGORY_LABEL
                ] ?? r.category}{" "}
                · {r.is_active ? "פעיל" : "לא פעיל"}
              </Text>
              {r.description ? (
                <Text className="mt-2 text-sm leading-6">{r.description}</Text>
              ) : null}
              {r.price_min != null || r.price_max != null ? (
                <Text className="mt-1 text-xs text-gray-500">
                  טווח מחיר: {r.price_min ?? "—"} – {r.price_max ?? "—"}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
