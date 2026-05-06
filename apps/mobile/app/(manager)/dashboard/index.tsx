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

type Tile = { label: string; value: number; href: string };

export default function ManagerDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);

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

        const [
          buildings,
          residents,
          openReqs,
          pendingPay,
          quotePending,
        ] = await Promise.all([
          supabase
            .from("buildings")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId),
          supabase
            .from("unit_residents")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
            .eq("status", "active"),
          supabase
            .from("service_requests")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
            .in("status", ["open", "assigned", "in_progress"]),
          supabase
            .from("payments")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
            .eq("status", "pending"),
          supabase
            .from("quote_requests")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
            .eq("status", "pending"),
        ]);

        if (!cancelled) {
          setTiles([
            {
              label: "בניינים",
              value: buildings.count ?? 0,
              href: "/(manager)/buildings",
            },
            {
              label: "דיירים פעילים",
              value: residents.count ?? 0,
              href: "/(manager)/more/residents",
            },
            {
              label: "קריאות פתוחות / בטיפול",
              value: openReqs.count ?? 0,
              href: "/(manager)/service-requests",
            },
            {
              label: "תשלומים ממתינים",
              value: pendingPay.count ?? 0,
              href: "/(manager)/more/payments",
            },
            {
              label: "בקשות הצעה ממתינות",
              value: quotePending.count ?? 0,
              href: "/(manager)/quote-requests",
            },
          ]);
        }
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
      <Text className="mb-1 text-2xl font-bold">לוח בקרה</Text>
      <Text className="mb-6 text-sm text-gray-600">
        סיכום מהיר — לפי הארגון שלך.
      </Text>
      <View className="gap-3 pb-8">
        {tiles.map((t) => (
          <Pressable
            key={t.href}
            onPress={() => router.push(t.href as never)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-4 active:bg-slate-50"
          >
            <Text className="text-base font-medium text-slate-800">
              {t.label}
            </Text>
            <Text className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
              {t.value}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
