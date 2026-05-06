import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";

export default function ManagerTenantSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tenant, setTenant] = useState<{
    name: string;
    contact_email: string | null;
    contact_phone: string | null;
    plan: string | null;
    primary_color: string | null;
    is_active: boolean | null;
  } | null>(null);

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

        const { data, error } = await supabase
          .from("business_profiles")
          .select(
            "name, contact_email, contact_phone, plan, primary_color, is_active"
          )
          .eq("id", tenantId)
          .maybeSingle();

        if (error) {
          setErr(error.message);
          return;
        }
        if (!cancelled) setTenant(data);
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

  if (!tenant) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-gray-600">לא נמצא ארגון.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-4">
      <Text className="mb-1 text-xl font-bold">{tenant.name}</Text>

      <View className="gap-4 pb-8">
        <View>
          <Text className="text-xs text-gray-500">אימייל יצירת קשר</Text>
          <Text className="text-base">{tenant.contact_email ?? "—"}</Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500">טלפון</Text>
          <Text className="text-base">{tenant.contact_phone ?? "—"}</Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500">תוכנית</Text>
          <Text className="text-base">{tenant.plan ?? "—"}</Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500">צבע ראשי</Text>
          <Text className="font-mono text-base">
            {tenant.primary_color ?? "—"}
          </Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500">פעיל</Text>
          <Text className="text-base">
            {tenant.is_active ? "כן" : "לא"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
