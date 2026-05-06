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

export type ManagerBrand = { name: string; logoUrl: string | null };

export type AuthProfile = {
  userId: string;
  profileId: string;
  fullName: string;
  role: UserRole;
  tenantId: string | null;
  /** FK ל-business_profiles — סינון רשומות לפי עסק */
  businessProfileId: string | null;
  /** join ל-business_profiles — למנהלים; null אם אין שורה / לא מנהל */
  managerBrand: ManagerBrand | null;
};

type ProfileRowWithBp = {
  id: string;
  full_name: string;
  role: UserRole;
  business_profile_id: string | null;
  building_id: string | null;
  unit_id: string | null;
  business_profiles:
    | { name: string; logo_url: string | null }
    | { name: string; logo_url: string | null }[]
    | null;
};

function brandFromJoin(
  nested: ProfileRowWithBp["business_profiles"]
): ManagerBrand | null {
  if (!nested) return null;
  const row = Array.isArray(nested) ? nested[0] : nested;
  if (!row?.name) return null;
  return { name: row.name, logoUrl: row.logo_url };
}

/** קריאה אחת לבקשת RSC — layout + עמודים חולקים את אותה תוצאה */
export const getAuthProfile = cache(
  async (): Promise<AuthProfile | null> => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: row, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, role, business_profile_id, building_id, unit_id, business_profiles(name, logo_url)"
      )
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (error || !row) return null;

    const typed = row as unknown as ProfileRowWithBp;

    const jwtBiz = businessProfileIdFromJwtAppMetadata(user.app_metadata);
    let businessProfileId =
      typed.business_profile_id ?? jwtBiz ?? null;

    let managerBrand: ManagerBrand | null = null;
    if (typed.role === "manager") {
      managerBrand = brandFromJoin(typed.business_profiles);
    }

    if (!businessProfileId) {
      businessProfileId = await inferBusinessProfileIdFromProfileLinks(
        supabase,
        typed
      );
    }

    if (
      typed.role === "manager" &&
      businessProfileId &&
      !managerBrand
    ) {
      const { data: bp } = await supabase
        .from("business_profiles")
        .select("name, logo_url")
        .eq("id", businessProfileId)
        .maybeSingle();
      if (bp?.name) {
        managerBrand = { name: bp.name, logoUrl: bp.logo_url };
      }
    }

    return {
      userId: user.id,
      profileId: typed.id,
      fullName: typed.full_name,
      role: typed.role as UserRole,
      tenantId: businessProfileId,
      businessProfileId,
      managerBrand: typed.role === "manager" ? managerBrand : null,
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
