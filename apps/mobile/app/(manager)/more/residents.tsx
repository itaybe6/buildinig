import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";
import { resolveTenantIdForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";

export default function ManagerResidentsScreen() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<
    {
      id: string;
      full_name: string;
      phone: string | null;
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
          .from("profiles")
          .select("id, full_name, phone, is_active")
          .eq("tenant_id", tenantId)
          .eq("role", "resident")
          .order("full_name");

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
      <Text className="mb-4 text-sm text-gray-600">
        דיירים עם תפקיד resident בארגון.
      </Text>
      {rows.length === 0 ? (
        <Text className="text-gray-500">אין דיירים.</Text>
      ) : (
        <View className="gap-2 pb-8">
          {rows.map((r) => (
            <View
              key={r.id}
              className="rounded-lg border border-slate-200 px-3 py-3"
            >
              <Text className="font-semibold">{r.full_name}</Text>
              <Text className="text-sm text-gray-600">{r.phone ?? "—"}</Text>
              <Text className="mt-1 text-xs text-gray-400">
                {r.is_active ? "פעיל" : "לא פעיל"}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
