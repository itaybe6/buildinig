import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

type ResidentRow = {
  id: string;
  full_name: string;
  phone: string | null;
  is_active: boolean | null;
  building_id: string | null;
  unit_id: string | null;
};

type BuildingRow = { id: string; address: string; city: string };

type UnitRow = {
  id: string;
  unit_number: string;
  floor_number: number | null;
  building_id: string;
  resident_profile_id: string | null;
};

function displayPhone(r: ResidentRow): string {
  return r.phone?.trim() || "—";
}

export default function ManagerResidentsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<BuildingRow[]>([]);
  const [residents, setResidents] = useState<ResidentRow[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
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

      const bRes = await supabase
        .from("buildings")
        .select("id, address, city")
        .eq("business_profile_id", businessProfileId)
        .order("address");

      if (bRes.error) {
        setErr(bRes.error.message);
        return;
      }

      const buildingList = (bRes.data ?? []) as BuildingRow[];
      const buildingIds = buildingList.map((b) => b.id);

      const [rRes, uRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, phone, is_active")
          .eq("business_profile_id", businessProfileId)
          .eq("role", "resident")
          .order("full_name"),
        buildingIds.length > 0
          ? supabase
              .from("units")
              .select(
                "id, unit_number, floor_number, building_id, resident_profile_id"
              )
              .in("building_id", buildingIds)
          : { data: [] as UnitRow[], error: null },
      ]);

      if (rRes.error) {
        setErr(rRes.error.message);
        return;
      }
      if (uRes.error) {
        setErr(uRes.error.message);
        return;
      }

      const unitsList = (uRes.data ?? []) as UnitRow[];
      const unitByResidentId = new Map(
        unitsList
          .filter((u) => u.resident_profile_id)
          .map((u) => [u.resident_profile_id as string, u] as const)
      );

      const residentRows: ResidentRow[] = (rRes.data ?? []).map((p) => {
        const u = unitByResidentId.get(p.id);
        return {
          ...p,
          building_id: u?.building_id ?? null,
          unit_id: u?.id ?? null,
        };
      });

      setBuildings(buildingList);
      setResidents(residentRows);
      setUnits(unitsList);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unitById = useMemo(() => {
    const m = new Map<string, UnitRow>();
    for (const u of units) m.set(u.id, u);
    return m;
  }, [units]);

  const { unassigned, byBuilding, orphanBuildingIds } = useMemo(() => {
    const un: ResidentRow[] = [];
    const by = new Map<string, ResidentRow[]>();
    for (const r of residents) {
      if (!r.building_id) {
        un.push(r);
        continue;
      }
      const list = by.get(r.building_id) ?? [];
      list.push(r);
      by.set(r.building_id, list);
    }
    const known = new Set(buildings.map((b) => b.id));
    const orphan: string[] = [];
    for (const id of by.keys()) {
      if (!known.has(id)) orphan.push(id);
    }
    return { unassigned: un, byBuilding: by, orphanBuildingIds: orphan };
  }, [residents, buildings]);

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

  if (!residents.length) {
    return (
      <View className="flex-1 bg-white px-4 pt-4">
        <Text className="text-gray-500">אין דיירים בארגון.</Text>
      </View>
    );
  }

  const renderRows = (list: ResidentRow[]) => (
    <View className="gap-2">
      {list.map((r) => {
        const u = r.unit_id ? unitById.get(r.unit_id) : undefined;
        return (
          <View
            key={r.id}
            className="rounded-lg border border-slate-200 bg-white px-3 py-3"
          >
            <Text className="font-semibold">{r.full_name}</Text>
            <Text className="text-sm text-gray-600">{displayPhone(r)}</Text>
            <Text className="mt-1 text-sm text-gray-700">
              דירה {u?.unit_number ?? "—"}
              {u?.floor_number != null
                ? ` · קומה ${u.floor_number}`
                : ""}
            </Text>
            <Text className="mt-1 text-xs text-gray-400">
              {r.is_active === false ? "לא פעיל" : "פעיל"}
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-4">
      <Text className="mb-4 text-sm text-gray-600">
        דיירי הארגון לפי בניין; שיוך דירה ב־units.resident_profile_id.
      </Text>

      {unassigned.length > 0 ? (
        <View className="mb-6">
          <Text className="mb-2 text-base font-semibold text-slate-800">
            ללא דירה משויכת
          </Text>
          {renderRows(unassigned)}
        </View>
      ) : null}

      {buildings.map((b) => {
        const list = byBuilding.get(b.id);
        if (!list?.length) return null;
        return (
          <View key={b.id} className="mb-6">
            <View className="mb-2 flex-row flex-wrap items-baseline justify-between gap-1">
              <Text className="text-base font-semibold text-slate-800">
                {b.address}
              </Text>
              <Text className="text-sm text-gray-500">{b.city}</Text>
            </View>
            {renderRows(list)}
            <Pressable
              onPress={() =>
                router.push(`/(manager)/buildings/${b.id}` as never)
              }
              className="mt-2 self-end"
            >
              <Text className="text-sm font-medium text-blue-600">
                לפרטי הבניין
              </Text>
            </Pressable>
          </View>
        );
      })}

      {orphanBuildingIds.map((bid) => {
        const list = byBuilding.get(bid);
        if (!list?.length) return null;
        return (
          <View key={bid} className="mb-6">
            <Text className="mb-2 text-base font-semibold text-slate-800">
              בניין (לא ברשימה)
            </Text>
            <Text className="mb-2 text-xs text-amber-700">
              ייתכן שהבניין הוסר או שהשיוך לא עודכן.
            </Text>
            {renderRows(list)}
          </View>
        );
      })}

      <View className="h-8" />
    </ScrollView>
  );
}
