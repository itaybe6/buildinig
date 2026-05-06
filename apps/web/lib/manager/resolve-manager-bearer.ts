import type { Database } from "@my-project/supabase";
import { tryGetBusinessId } from "@/lib/branding/getBusinessId";
import {
  businessProfileIdFromJwtAppMetadata,
  inferBusinessProfileIdFromProfileLinks,
} from "@my-project/shared";
import { createClient } from "@supabase/supabase-js";

export type ManagerBearerScope = {
  userId: string;
  profileId: string;
  tenantId: string;
  businessProfileId: string;
};

/**
 * מאמת Bearer JWT של מנהל ומחזיר היקף ארגון + מזהי פרופיל (לממשק API / מובייל).
 */
export async function resolveManagerBearerScope(
  req: Request
): Promise<ManagerBearerScope | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const authHeader = req.headers.get("authorization");
  const token =
    authHeader?.startsWith("Bearer ") || authHeader?.startsWith("bearer ")
      ? authHeader.slice(7)
      : null;
  if (!token) return null;

  const supabase = createClient<Database>(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, business_profile_id, building_id, unit_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "manager") {
    return null;
  }

  const jwtBiz = businessProfileIdFromJwtAppMetadata(user.app_metadata);
  let businessProfileId = profile.business_profile_id ?? jwtBiz ?? null;
  if (!businessProfileId) {
    businessProfileId = await inferBusinessProfileIdFromProfileLinks(
      supabase,
      profile
    );
  }

  if (!businessProfileId) {
    businessProfileId = tryGetBusinessId();
  }

  if (!businessProfileId) {
    return null;
  }

  return {
    userId: user.id,
    profileId: profile.id,
    tenantId: businessProfileId,
    businessProfileId,
  };
}
