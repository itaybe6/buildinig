import { supabase as defaultClient, tryGetBusinessId } from "./supabase";

export type TenantScope = {
  tenantId: string | null;
  businessProfileId: string | null;
};

/** tenant פעיל + business_profiles לסינון רשומות לפי עסק */
export async function resolveTenantScopeForUser(
  client: typeof defaultClient,
  authUserId: string
): Promise<TenantScope> {
  const { data: profile } = await client
    .from("profiles")
    .select("tenant_id, business_profile_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  let tenantId = profile?.tenant_id ?? null;
  let businessProfileId = profile?.business_profile_id ?? null;

  if (!tenantId) {
    tenantId = tryGetBusinessId();
  }

  // `profiles.tenant_id` is the business profile id (FK → `business_profiles.id`).
  if (tenantId && !businessProfileId) {
    businessProfileId = tenantId;
  }

  return { tenantId, businessProfileId };
}
