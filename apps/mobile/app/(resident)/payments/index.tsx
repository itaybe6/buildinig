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
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";

export default function ResidentPaymentsScreen() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<
    {
      id: string;
      amount: string;
      currency: string | null;
      status: string;
      type: string;
      due_date: string;
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

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!profile) {
          setErr("לא נמצא פרופיל");
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
          .from("payments")
          .select("id, amount, currency, status, type, due_date")
          .eq("business_profile_id", businessProfileId)
          .eq("resident_id", profile.id)
          .order("due_date", { ascending: false })
          .limit(80);

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
      <Text className="mb-4 text-xl font-bold">התשלומים שלי</Text>
      {rows.length === 0 ? (
        <Text className="text-gray-500">אין תשלומים רשומים.</Text>
      ) : (
        <View className="gap-3 pb-8">
          {rows.map((r) => (
            <View
              key={r.id}
              className="rounded-lg border border-slate-200 px-3 py-3"
            >
              <Text className="text-lg font-semibold tabular-nums">
                {r.amount} {r.currency ?? "ILS"}
              </Text>
              <Text className="text-sm text-gray-600">
                {PAYMENT_TYPE_LABEL[r.type as keyof typeof PAYMENT_TYPE_LABEL]}{" "}
                ·{" "}
                {PAYMENT_STATUS_LABEL[r.status as keyof typeof PAYMENT_STATUS_LABEL]}
              </Text>
              <Text className="mt-1 text-sm text-gray-500">
                יעד: {new Date(r.due_date).toLocaleDateString("he-IL")}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
