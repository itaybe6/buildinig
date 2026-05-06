import { supabase as defaultClient, tryGetBusinessId } from "./supabase";

/** מזהה ארגון לפי פרופיל או BUSINESS_ID בלבן-שיח */
export async function resolveTenantIdForUser(
  client: typeof defaultClient,
  authUserId: string
): Promise<string | null> {
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (profile?.tenant_id) return profile.tenant_id;
  return tryGetBusinessId();
}
