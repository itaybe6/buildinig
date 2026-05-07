import "server-only";

import { createClient } from "@/lib/supabase/server";
import { SERVICE_REQUEST_NEW_NOTIFICATION_TYPE } from "@my-project/shared";

export async function markServiceRequestNotificationsRead(
  profileId: string
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("profile_id", profileId)
    .eq("type", SERVICE_REQUEST_NEW_NOTIFICATION_TYPE)
    .eq("is_read", false);
}

export async function countUnreadServiceRequestNotifications(
  profileId: string
): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .eq("type", SERVICE_REQUEST_NEW_NOTIFICATION_TYPE)
    .eq("is_read", false);

  if (error) return 0;
  return count ?? 0;
}
