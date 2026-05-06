import { ANNOUNCEMENT_AUDIENCE_LABEL } from "@my-project/shared";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";

export default function ManagerAnnouncementsScreen() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<
    {
      id: string;
      title: string;
      body: string | null;
      audience: string;
      is_pinned: boolean | null;
      created_at: string | null;
      buildings: unknown;
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
          .from("announcements")
          .select(
            "id, title, body, audience, is_pinned, created_at, buildings ( name, city )"
          )
          .eq("business_profile_id", businessProfileId)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) {
          setErr(error.message);
          return;
        }
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
        <Text className="text-gray-500">אין מודעות.</Text>
      ) : (
        <View className="gap-4 pb-8">
          {rows.map((r) => {
            const b = r.buildings as unknown as {
              name: string;
              city: string | null;
            } | null;
            return (
              <View
                key={r.id}
                className="rounded-lg border border-slate-200 px-3 py-3"
              >
                {r.is_pinned ? (
                  <Text className="mb-1 text-xs font-semibold text-amber-700">
                    נעוץ
                  </Text>
                ) : null}
                <Text className="text-lg font-semibold">{r.title}</Text>
                <Text className="mt-1 text-xs text-gray-500">
                  {ANNOUNCEMENT_AUDIENCE_LABEL[
                    r.audience as keyof typeof ANNOUNCEMENT_AUDIENCE_LABEL
                  ] ?? r.audience}
                  {b
                    ? ` · ${b.name}${b.city ? `, ${b.city}` : ""}`
                    : ""}
                </Text>
                {r.body ? (
                  <Text className="mt-2 text-sm leading-6 text-gray-800">
                    {r.body}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
