import { QUOTE_STATUS_LABEL } from "@my-project/shared";
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

export default function ManagerQuoteRequestsListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<
    {
      id: string;
      title: string;
      status: string;
      created_at: string | null;
      buildings: unknown;
      units: unknown;
      service_types: unknown;
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

        const { data } = await supabase
          .from("quote_requests")
          .select(
            `
            id,
            title,
            status,
            created_at,
            buildings ( name ),
            units ( unit_number ),
            service_types ( name )
          `
          )
          .eq("tenant_id", tenantId)
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
      {rows.length === 0 ? (
        <Text className="text-gray-500">אין בקשות הצעת מחיר.</Text>
      ) : (
        <View className="gap-2 pb-8">
          {rows.map((r) => {
            const b = r.buildings as unknown as { name: string } | null;
            const u = r.units as unknown as { unit_number: string } | null;
            const st = r.service_types as unknown as { name: string } | null;
            return (
              <Pressable
                key={r.id}
                onPress={() =>
                  router.push(`/(manager)/quote-requests/${r.id}` as never)
                }
                className="rounded-lg border border-slate-200 px-3 py-3 active:bg-slate-50"
              >
                <Text className="font-semibold">{r.title}</Text>
                <Text className="text-sm text-gray-600">
                  {b?.name ?? "בניין"} · דירה {u?.unit_number ?? "—"} ·{" "}
                  {st?.name ?? "שירות"}
                </Text>
                <Text className="mt-1 text-xs text-gray-500">
                  {QUOTE_STATUS_LABEL[
                    r.status as keyof typeof QUOTE_STATUS_LABEL
                  ] ?? r.status}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
