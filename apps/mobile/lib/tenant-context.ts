import {
  businessProfileIdFromJwtAppMetadata,
  inferBusinessProfileIdFromProfileLinks,
} from "@my-project/shared";

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
    .select("business_profile_id, tenant_id, building_id, unit_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  const {
    data: { user },
  } = await client.auth.getUser();
  const jwtBiz =
    user?.id === authUserId
      ? businessProfileIdFromJwtAppMetadata(user.app_metadata)
      : null;

  let businessProfileId =
    profile?.business_profile_id ?? jwtBiz ?? profile?.tenant_id ?? null;
  if (!businessProfileId && profile) {
    businessProfileId = await inferBusinessProfileIdFromProfileLinks(
      client,
      profile
    );
  }

  let tenantId = businessProfileId;

  if (!tenantId) {
    tenantId = tryGetBusinessId();
  }

  if (tenantId && !businessProfileId) {
    businessProfileId = tenantId;
  }

  return { tenantId, businessProfileId };
}
