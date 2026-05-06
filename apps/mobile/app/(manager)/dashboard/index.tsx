import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { countUnitsByBuildingId } from "@/lib/building-unit-helpers";
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";

type Tile = { label: string; value: number; href: string };

type BuildingRow = {
  id: string;
  address: string;
  city: string;
  floors_count: number | null;
  is_active: boolean | null;
};

export default function ManagerDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [buildings, setBuildings] = useState<BuildingRow[]>([]);
  const [unitCountByBuilding, setUnitCountByBuilding] = useState<
    Record<string, number>
  >({});

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

        const buildingList = await supabase
          .from("buildings")
          .select("id, address, city, floors_count, is_active")
          .eq("business_profile_id", businessProfileId)
          .order("address");

        if (buildingList.error) {
          setErr(buildingList.error.message);
          return;
        }

        const buildingRows = (buildingList.data ?? []) as BuildingRow[];
        const buildingIds = buildingRows.map((b) => b.id);

        const [buildingsCount, openReqs, pendingPay, quotePending, unitRows] =
          await Promise.all([
            supabase
              .from("buildings")
              .select("id", { count: "exact", head: true })
              .eq("business_profile_id", businessProfileId),
            supabase
              .from("service_requests")
              .select("id", { count: "exact", head: true })
              .eq("business_profile_id", businessProfileId)
              .in("status", ["open", "assigned", "in_progress"]),
            supabase
              .from("payments")
              .select("id", { count: "exact", head: true })
              .eq("business_profile_id", businessProfileId)
              .eq("status", "pending"),
            supabase
              .from("quote_requests")
              .select("id", { count: "exact", head: true })
              .eq("business_profile_id", businessProfileId)
              .eq("status", "pending"),
            buildingIds.length > 0
              ? supabase
                  .from("units")
                  .select("building_id")
                  .in("building_id", buildingIds)
              : Promise.resolve({
                  data: [] as { building_id: string }[],
                  error: null,
                }),
          ]);

        const unitRowsSafe =
          unitRows.error || !unitRows.data ? [] : unitRows.data;
        const unitCounts = Object.fromEntries(
          countUnitsByBuildingId(unitRowsSafe),
        );

        if (!cancelled) {
          setBuildings(buildingRows);
          setUnitCountByBuilding(unitCounts);
          setTiles([
            {
              label: "בניינים",
              value: buildingsCount.count ?? 0,
              href: "/(manager)/buildings",
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
      <View className="gap-3 pb-6">
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

      <Text className="mb-2 text-lg font-semibold text-slate-900">
        הבניינים שלך
      </Text>
      <Text className="mb-3 text-sm text-gray-600">
        לחיצה על בניין — פרטים ומשתמשים משויכים.
      </Text>
      {buildings.length === 0 ? (
        <Text className="pb-8 text-gray-500">
          אין בניינים בארגון.
        </Text>
      ) : (
        <View className="gap-2 pb-8">
          {buildings.map((b) => (
            <Pressable
              key={b.id}
              onPress={() =>
                router.push(`/(manager)/buildings/${b.id}` as never)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 active:bg-slate-50"
            >
              <Text className="font-semibold text-blue-700">{b.address}</Text>
              <Text className="mt-1 text-sm text-gray-600">{b.city}</Text>
              <Text className="mt-1 text-xs text-gray-500">
                קומות: {b.floors_count ?? "—"} · דירות:{" "}
                {unitCountByBuilding[b.id] ?? 0} ·{" "}
                {b.is_active ? "פעיל" : "לא פעיל"}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
