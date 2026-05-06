import "server-only";

import { tryGetBusinessId } from "@/lib/branding/getBusinessId";
import { createClient } from "@/lib/supabase/server";
import {
  businessProfileIdFromJwtAppMetadata,
  inferBusinessProfileIdFromProfileLinks,
  type UserRole,
} from "@my-project/shared";
import { redirect } from "next/navigation";

export type AuthProfile = {
  userId: string;
  profileId: string;
  fullName: string;
  role: UserRole;
  tenantId: string | null;
  /** FK ל-business_profiles — סינון רשומות לפי עסק */
  businessProfileId: string | null;
};

export async function getAuthProfile(): Promise<AuthProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row } = await supabase
    .from("profiles")
    .select("id, full_name, role, business_profile_id, building_id, unit_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!row) return null;

  const jwtBiz = businessProfileIdFromJwtAppMetadata(user.app_metadata);
  let businessProfileId = row.business_profile_id ?? jwtBiz ?? null;
  if (!businessProfileId) {
    businessProfileId = await inferBusinessProfileIdFromProfileLinks(supabase, row);
  }

  return {
    userId: user.id,
    profileId: row.id,
    fullName: row.full_name,
    role: row.role as UserRole,
    tenantId: businessProfileId,
    businessProfileId,
  };
}

export async function requireAuthProfile(): Promise<AuthProfile> {
  const profile = await getAuthProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** ארגון פעיל: פרופיל / claim ב-JWT (app_metadata) או BUSINESS_ID למנהל-על בלי business_profile_id */
export function resolveActiveTenantId(profile: AuthProfile): string | null {
  if (profile.businessProfileId) return profile.businessProfileId;
  if (profile.role === "super_admin") return tryGetBusinessId();
  return null;
}

export type ManagerTenantContext =
  | {
      ok: true;
      profile: AuthProfile;
      tenantId: string;
      businessProfileId: string;
    }
  | {
      ok: false;
      profile: AuthProfile;
      reason: "no_tenant" | "no_business_profile";
    };

function tenantScopeFromProfile(profile: AuthProfile): ManagerTenantContext {
  const tenantId = resolveActiveTenantId(profile);
  if (!tenantId) return { ok: false, profile, reason: "no_tenant" };

  let businessProfileId = profile.businessProfileId;
  if (!businessProfileId) {
    businessProfileId = tenantId;
  }

  if (!businessProfileId) {
    return { ok: false, profile, reason: "no_business_profile" };
  }

  return { ok: true, profile, tenantId, businessProfileId };
}

export async function getManagerTenantContext(): Promise<ManagerTenantContext> {
  const profile = await requireAuthProfile();
  if (profile.role === "resident") redirect("/home");
  if (profile.role === "employee") redirect("/assignments");
  return tenantScopeFromProfile(profile);
}

/** ממשק תושב — אותו סינון tenant כמו מנהל */
export async function getResidentTenantContext(): Promise<ManagerTenantContext> {
  const profile = await requireAuthProfile();
  if (profile.role !== "resident") redirect("/dashboard");
  return tenantScopeFromProfile(profile);
}

/** ממשק עובד — אותו סינון tenant כמו מנהל */
export async function getEmployeeTenantContext(): Promise<ManagerTenantContext> {
  const profile = await requireAuthProfile();
  if (profile.role !== "employee") redirect("/dashboard");
  return tenantScopeFromProfile(profile);
}

export async function requireSuperAdmin(): Promise<AuthProfile> {
  const profile = await requireAuthProfile();
  if (profile.role !== "super_admin") redirect("/dashboard");
  return profile;
}
