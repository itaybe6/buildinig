import {
  PAYMENT_STATUS_LABEL,
  PAYMENT_TYPE_LABEL,
} from "@my-project/shared";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";
import { resolveTenantIdForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";

type PaymentRow = {
  id: string;
  amount: string;
  currency: string | null;
  status: string;
  type: string;
  due_date: string;
  description: string | null;
  buildingName: string;
  unitNumber: string;
  residentName: string;
};

export default function ManagerPaymentsScreen() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<PaymentRow[]>([]);

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

        const { data: payments, error } = await supabase
          .from("payments")
          .select(
            "id, amount, currency, status, type, due_date, description, building_id, unit_id, resident_id"
          )
          .eq("tenant_id", tenantId)
          .order("due_date", { ascending: false })
          .limit(100);

        if (error) {
          setErr(error.message);
          return;
        }
        if (!payments?.length) {
          if (!cancelled) setRows([]);
          return;
        }

        const buildingIds = [...new Set(payments.map((p) => p.building_id))];
        const unitIds = [...new Set(payments.map((p) => p.unit_id))];
        const residentIds = [...new Set(payments.map((p) => p.resident_id))];

        const [buildingsRes, unitsRes, profilesRes] = await Promise.all([
          supabase.from("buildings").select("id, name").in("id", buildingIds),
          supabase.from("units").select("id, unit_number").in("id", unitIds),
          supabase.from("profiles").select("id, full_name").in("id", residentIds),
        ]);

        const bMap = new Map(
          (buildingsRes.data ?? []).map((b) => [b.id, b.name])
        );
        const uMap = new Map(
          (unitsRes.data ?? []).map((u) => [u.id, u.unit_number])
        );
        const rMap = new Map(
          (profilesRes.data ?? []).map((p) => [p.id, p.full_name])
        );

        const merged: PaymentRow[] = payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          type: p.type,
          due_date: p.due_date,
          description: p.description,
          buildingName: bMap.get(p.building_id) ?? "—",
          unitNumber: uMap.get(p.unit_id) ?? "—",
          residentName: rMap.get(p.resident_id) ?? "—",
        }));

        if (!cancelled) setRows(merged);
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
        <Text className="text-gray-500">אין תשלומים.</Text>
      ) : (
        <View className="gap-3 pb-8">
          {rows.map((r) => (
              <View
                key={r.id}
                className="rounded-lg border border-slate-200 px-3 py-3"
              >
                <Text className="font-semibold">
                  {r.amount} {r.currency ?? "ILS"}
                </Text>
                <Text className="text-sm text-gray-600">
                  {PAYMENT_TYPE_LABEL[
                    r.type as keyof typeof PAYMENT_TYPE_LABEL
                  ] ?? r.type}{" "}
                  ·{" "}
                  {PAYMENT_STATUS_LABEL[
                    r.status as keyof typeof PAYMENT_STATUS_LABEL
                  ] ?? r.status}
                </Text>
                <Text className="mt-1 text-xs text-gray-500">
                  {r.buildingName} · דירה {r.unitNumber} · {r.residentName}
                </Text>
                {r.due_date ? (
                  <Text className="mt-1 text-xs text-gray-400">
                    יעד: {new Date(r.due_date).toLocaleDateString("he-IL")}
                  </Text>
                ) : null}
                {r.description ? (
                  <Text className="mt-2 text-sm text-gray-700">
                    {r.description}
                  </Text>
                ) : null}
              </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
