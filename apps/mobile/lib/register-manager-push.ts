import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerManagerPushToken(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "manager") return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let nextStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    nextStatus = status;
  }
  if (nextStatus !== "granted") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
      ?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId || typeof projectId !== "string") {
    console.warn(
      "[push] Missing EAS projectId in app config (extra.eas.projectId / EXPO_PUBLIC_EAS_PROJECT_ID)."
    );
    return;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  const expoPushToken = tokenResponse.data;

  const platform = Platform.OS === "ios" ? "ios" : "android";
  const now = new Date().toISOString();

  const { error } = await supabase.from("push_tokens").upsert(
    {
      profile_id: profile.id,
      expo_push_token: expoPushToken,
      platform,
      updated_at: now,
    },
    { onConflict: "profile_id,expo_push_token" }
  );

  if (error) {
    console.warn("[push] Failed to save push token", error.message);
  }
}
