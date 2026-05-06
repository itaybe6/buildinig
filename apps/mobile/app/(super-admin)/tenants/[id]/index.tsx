import { supabase } from "@/lib/supabase";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type BuildingRow = {
  id: string;
  address: string;
  city: string;
  floors_count: number;
};

type TenantDetail = {
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  plan: string | null;
  commission_rate: string | null;
  is_active: boolean | null;
  created_at: string | null;
  legal_name: string | null;
  tax_id: string | null;
};

type ManagerRow = {
  id: string;
  full_name: string;
  phone: string | null;
  is_active: boolean | null;
};

export default function SuperAdminTenantDetailScreen() {
  const { id: tenantId, new_tenant: newTenant } = useLocalSearchParams<{
    id: string;
    new_tenant?: string;
  }>();
  const fromNewFlow =
    newTenant === "1" ||
    newTenant === "true" ||
    (Array.isArray(newTenant) && newTenant[0] === "1");
  const router = useRouter();

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [managers, setManagers] = useState<ManagerRow[]>([]);
  const [buildings, setBuildings] = useState<BuildingRow[]>([]);
  const [counts, setCounts] = useState({
    buildings: 0,
    units: 0,
    requests: 0,
    openRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [floors, setFloors] = useState("1");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);

    const tid = Array.isArray(tenantId) ? tenantId[0] : tenantId;

    const { data: trow, error: te } = await supabase
      .from("tenants")
      .select(
        `
        name,
        contact_email,
        contact_phone,
        plan,
        commission_rate,
        is_active,
        created_at,
        business_profiles ( legal_name, tax_id )
      `
      )
      .eq("id", tid)
      .maybeSingle();

    const { data: blist, error: be } = await supabase
      .from("buildings")
      .select("id, address, city, floors_count")
      .eq("tenant_id", tid)
      .order("address");

    const { data: mgrs, error: me } = await supabase
      .from("profiles")
      .select("id, full_name, phone, is_active")
      .eq("role", "manager")
      .eq("tenant_id", tid)
      .order("full_name");

    const [bc, uc, rc, orc] = await Promise.all([
      supabase
        .from("buildings")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tid),
      supabase
        .from("units")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tid),
      supabase
        .from("service_requests")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tid),
      supabase
        .from("service_requests")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tid)
        .in("status", ["open", "assigned", "in_progress"]),
    ]);

    setLoading(false);

    if (te || !trow) {
      Alert.alert("שגיאה", te?.message ?? "לא נמצא לקוח");
      router.back();
      return;
    }

    if (be) {
      Alert.alert("שגיאה", be.message);
      return;
    }
    if (me) {
      Alert.alert("שגיאה", me.message);
      return;
    }

    const rawBp = trow.business_profiles as unknown;
    const bp = Array.isArray(rawBp) ? rawBp[0] : rawBp;
    const legal =
      bp && typeof bp === "object"
        ? (bp as { legal_name: string | null }).legal_name
        : null;
    const tax =
      bp && typeof bp === "object"
        ? (bp as { tax_id: string | null }).tax_id
        : null;

    setTenant({
      name: trow.name,
      contact_email: trow.contact_email,
      contact_phone: trow.contact_phone,
      plan: trow.plan,
      commission_rate: trow.commission_rate,
      is_active: trow.is_active,
      created_at: trow.created_at,
      legal_name: legal,
      tax_id: tax,
    });
    setManagers((mgrs ?? []) as ManagerRow[]);
    setBuildings((blist ?? []) as BuildingRow[]);
    setCounts({
      buildings: bc.count ?? 0,
      units: uc.count ?? 0,
      requests: rc.count ?? 0,
      openRequests: orc.count ?? 0,
    });
  }, [tenantId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (fromNewFlow) setAddFormOpen(true);
  }, [fromNewFlow]);

  async function onAdd() {
    if (!tenantId) return;
    const tid = Array.isArray(tenantId) ? tenantId[0] : tenantId;
    setSaving(true);
    const floorsCount = Math.max(1, Number.parseInt(floors, 10) || 1);
    const { error } = await supabase.from("buildings").insert({
      tenant_id: tid,
      address: address.trim(),
      city: city.trim(),
      floors_count: floorsCount,
    });
    setSaving(false);
    if (error) {
      Alert.alert("שגיאה", error.message);
      return;
    }
    setAddress("");
    setCity("");
    setFloors("1");
    setAddFormOpen(false);
    void load();
  }

  const header = tenant ? (
    <View className="bg-white px-3 py-3">
      <Link href="/(super-admin)/tenants" asChild>
        <Pressable className="mb-3 self-start py-1 active:opacity-70">
          <Text className="text-[15px] font-semibold text-blue-600">
            חזרה ללקוחות
          </Text>
        </Pressable>
      </Link>

      <Text className="mb-1 text-xl font-bold text-gray-900">
        בקרה על עסק — {tenant.name}
      </Text>
      <Text className="mb-4 text-sm leading-relaxed text-gray-600">
        סקירת פעילות, פרטי לקוח והוספת בניינים.
      </Text>

      <View className="mb-4 flex-row flex-wrap gap-2">
        {[
          { label: "בניינים", value: counts.buildings },
          { label: "דירות", value: counts.units },
          { label: "קריאות", value: counts.requests },
          { label: "פתוחות", value: counts.openRequests },
        ].map((c) => (
          <View
            key={c.label}
            className="min-w-[44%] flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3"
          >
            <Text className="text-xs text-gray-500">{c.label}</Text>
            <Text className="mt-1 text-xl font-semibold tabular-nums">
              {c.value}
            </Text>
          </View>
        ))}
      </View>

      <View className="mb-4 rounded-xl border border-gray-200 p-4">
        <Text className="mb-2 font-semibold text-gray-900">פרטי עסק</Text>
        <Text className="text-sm text-gray-700">
          אימייל: {tenant.contact_email ?? "—"}
        </Text>
        <Text className="mt-1 text-sm text-gray-700">
          טלפון: {tenant.contact_phone ?? "—"}
        </Text>
        <Text className="mt-1 text-sm text-gray-700">
          שם משפטי: {tenant.legal_name ?? "—"}
        </Text>
        <Text className="mt-1 text-sm text-gray-700">
          ח״פ: {tenant.tax_id ?? "—"}
        </Text>
        <Text className="mt-1 text-sm text-gray-700">
          תוכנית: {tenant.plan ?? "—"}
        </Text>
        <Text className="mt-1 text-sm text-gray-700">
          עמלה: {tenant.commission_rate ?? "—"}
        </Text>
        <Text className="mt-1 text-sm text-gray-700">
          פעיל:{" "}
          {tenant.is_active === false ? (
            <Text className="text-amber-800">לא</Text>
          ) : (
            <Text className="text-green-800">כן</Text>
          )}
        </Text>
        <Text className="mt-1 text-sm text-gray-700">
          נוצר:{" "}
          {tenant.created_at
            ? new Date(tenant.created_at).toLocaleDateString("he-IL")
            : "—"}
        </Text>
      </View>

      <View className="mb-4 rounded-xl border border-gray-200 p-4">
        <Text className="mb-2 font-semibold text-gray-900">מנהלים משויכים</Text>
        {managers.length === 0 ? (
          <Text className="text-sm text-gray-500">אין מנהלים משויכים</Text>
        ) : (
          managers.map((m) => (
            <Text key={m.id} className="mb-1 text-sm text-gray-700">
              · {m.full_name}
              {m.phone ? ` — ${m.phone}` : ""}
              {m.is_active === false ? " (לא פעיל)" : ""}
            </Text>
          ))
        )}
      </View>

      {fromNewFlow ? (
        <View className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3">
          <Text className="font-semibold text-blue-950">העסק נוצר בהצלחה</Text>
          <Text className="mt-1 text-sm leading-relaxed text-blue-900/90">
            הוסיפו בניין אחד או יותר — כל בניין משויך ללקוח שיצרתם.
          </Text>
        </View>
      ) : null}

      {addFormOpen ? (
        <View className="mb-6 gap-2 rounded-xl border border-gray-200 p-4">
          <Text className="mb-2 font-medium">הוספת בניין</Text>
          <Text className="mb-3 text-sm text-gray-600">
            הזינו כתובת מלאה — אין שדה נפרד לשם בניין.
          </Text>
          <Text className="mb-1 text-sm text-gray-600">כתובת</Text>
          <TextInput
            className="mb-2 rounded-lg border border-gray-300 px-3 py-2 text-left"
            value={address}
            onChangeText={setAddress}
          />
          <Text className="mb-1 text-sm text-gray-600">עיר</Text>
          <TextInput
            className="mb-2 rounded-lg border border-gray-300 px-3 py-2 text-left"
            value={city}
            onChangeText={setCity}
          />
          <Text className="mb-1 text-sm text-gray-600">קומות</Text>
          <TextInput
            className="mb-3 rounded-lg border border-gray-300 px-3 py-2 text-left"
            keyboardType="number-pad"
            value={floors}
            onChangeText={setFloors}
          />
          <Pressable
            className="rounded-lg bg-blue-600 py-3 disabled:opacity-50"
            disabled={saving || !address.trim() || !city.trim()}
            onPress={() => void onAdd()}
          >
            <Text className="text-center font-semibold text-white">
              {saving ? "שומר…" : "הוסף בניין"}
            </Text>
          </Pressable>
          <Pressable
            className="mt-2 rounded-lg border border-gray-300 py-2.5 active:bg-gray-50"
            onPress={() => setAddFormOpen(false)}
          >
            <Text className="text-center font-semibold text-gray-700">ביטול</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          className="mb-6 rounded-xl bg-blue-600 px-4 py-3.5 active:opacity-90"
          onPress={() => setAddFormOpen(true)}
        >
          <Text className="text-center text-base font-semibold text-white">
            הוספת בניין
          </Text>
        </Pressable>
      )}

      <Text className="mb-2 font-medium">בניינים קיימים</Text>
    </View>
  ) : null;

  if (loading || !tenantId) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-white"
      data={buildings}
      keyExtractor={(b) => b.id}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <Text className="px-3 pb-6 text-center text-gray-500">
          אין בניינים עדיין
        </Text>
      }
      renderItem={({ item }) => (
        <View className="mx-3 mb-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <Text className="font-semibold">{item.address}</Text>
          <Text className="text-sm text-gray-600">{item.city}</Text>
          <Text className="text-sm text-gray-500">
            קומות: {item.floors_count}
          </Text>
        </View>
      )}
    />
  );
}
