import "server-only";

import { tryGetBusinessId } from "@/lib/branding/getBusinessId";
import { createClient } from "@/lib/supabase/server";
import {
  businessProfileIdFromJwtAppMetadata,
  inferBusinessProfileIdFromProfileLinks,
  type UserRole,
} from "@my-project/shared";
import { redirect } from "next/navigation";
import { cache } from "react";

export type AuthProfile = {
  userId: string;
  profileId: string;
  fullName: string;
  role: UserRole;
  tenantId: string | null;
  /** FK ל-business_profiles — סינון רשומות לפי עסק */
  businessProfileId: string | null;
};

/** קריאה אחת לבקשת RSC — layout + עמודים חולקים את אותה תוצאה */
export const getAuthProfile = cache(
  async (): Promise<AuthProfile | null> => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: row } = await supabase
      .from("profiles")
      .select(
        "id, full_name, role, business_profile_id, building_id, unit_id"
      )
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!row) return null;

    const jwtBiz = businessProfileIdFromJwtAppMetadata(user.app_metadata);
    let businessProfileId = row.business_profile_id ?? jwtBiz ?? null;
    if (!businessProfileId) {
      businessProfileId = await inferBusinessProfileIdFromProfileLinks(
        supabase,
        row
      );
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
);

export async function requireAuthProfile(): Promise<AuthProfile> {
  const profile = await getAuthProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** ארגון פעיל: פרופיל / JWT (app_metadata) / קישור בניין–יחידה; אחר כך BUSINESS_ID כמו במובייל */
export function resolveActiveTenantId(profile: AuthProfile): string | null {
  if (profile.businessProfileId) return profile.businessProfileId;
  return tryGetBusinessId();
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

export type ManagerBrand = { name: string; logoUrl: string | null };

/**
 * נתוני מיתוג של עסק עבור סרגל המנהל.
 * לא משתמשים ב-unstable_cache כאן — createClient() קורא ל-cookies(), ו-NEXT.js
 * אוסר גישה ל-dynamic data מתוך מימוש unstable_cache.
 */
export async function getManagerBrand(
  businessProfileId: string
): Promise<ManagerBrand | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("business_profiles")
    .select("name, logo_url")
    .eq("id", businessProfileId)
    .maybeSingle();
  if (!data) return null;
  return { name: data.name, logoUrl: data.logo_url };
}
