import { SERVICE_REQUEST_NEW_NOTIFICATION_TYPE } from "@my-project/shared";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { registerManagerPushToken } from "@/lib/register-manager-push";
import { supabase } from "@/lib/supabase";

export default function ManagerTabsLayout() {
  const [serviceRequestsBadge, setServiceRequestsBadge] = useState<
    number | string | undefined
  >();

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    async function setup() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!profile || cancelled || profile.role !== "manager") return;

      const managerProfileId = profile.id;

      await registerManagerPushToken();

      async function refreshBadge() {
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", managerProfileId)
          .eq("type", SERVICE_REQUEST_NEW_NOTIFICATION_TYPE)
          .eq("is_read", false);

        if (cancelled) return;
        const n = count ?? 0;
        if (n <= 0) {
          setServiceRequestsBadge(undefined);
          return;
        }
        setServiceRequestsBadge(n > 99 ? "99+" : n);
      }

      await refreshBadge();

      channel = supabase
        .channel(`manager-notifications-${managerProfileId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `profile_id=eq.${managerProfileId}`,
          },
          () => {
            void refreshBadge();
          }
        )
        .subscribe();
    }

    void setup();

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  return (
    <Tabs screenOptions={{ headerTitleAlign: "center" }}>
      <Tabs.Screen
        name="dashboard"
        options={{ title: "לוח בקרה", tabBarLabel: "בקרה" }}
      />
      <Tabs.Screen
        name="buildings"
        options={{
          title: "בניינים",
          tabBarLabel: "בניינים",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="service-requests"
        options={{
          title: "קריאות שירות",
          tabBarLabel: "קריאות",
          headerShown: false,
          tabBarBadge: serviceRequestsBadge,
        }}
      />
      <Tabs.Screen
        name="quote-requests"
        options={{
          title: "הצעות מחיר",
          tabBarLabel: "הצעות",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "עוד",
          tabBarLabel: "עוד",
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
