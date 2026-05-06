import "server-only";

import { tryGetBusinessId } from "@/lib/branding/getBusinessId";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@my-project/shared";
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
    .select("id, full_name, role, tenant_id, business_profile_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!row) return null;

  let businessProfileId = row.business_profile_id ?? null;

  if (row.tenant_id && !businessProfileId) {
    const { data: bp } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("tenant_id", row.tenant_id)
      .maybeSingle();
    businessProfileId = bp?.id ?? null;
  }

  return {
    userId: user.id,
    profileId: row.id,
    fullName: row.full_name,
    role: row.role as UserRole,
    tenantId: row.tenant_id,
    businessProfileId,
  };
}

export async function requireAuthProfile(): Promise<AuthProfile> {
  const profile = await getAuthProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** ארגון פעיל: פרופיל או BUSINESS_ID למנהל-על בלי tenant_id */
export function resolveActiveTenantId(profile: AuthProfile): string | null {
  if (profile.tenantId) return profile.tenantId;
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

export async function getManagerTenantContext(): Promise<ManagerTenantContext> {
  const profile = await requireAuthProfile();
  if (profile.role === "resident") redirect("/unauthorized");

  const tenantId = resolveActiveTenantId(profile);
  if (!tenantId) return { ok: false, profile, reason: "no_tenant" };

  const supabase = createClient();
  let businessProfileId = profile.businessProfileId;

  if (!businessProfileId) {
    const { data: bp } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    businessProfileId = bp?.id ?? null;
  }

  if (!businessProfileId) {
    return { ok: false, profile, reason: "no_business_profile" };
  }

  return { ok: true, profile, tenantId, businessProfileId };
}

export async function requireSuperAdmin(): Promise<AuthProfile> {
  const profile = await requireAuthProfile();
  if (profile.role !== "super_admin") redirect("/dashboard");
  return profile;
}
