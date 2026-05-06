import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import type { Database } from "@my-project/supabase";

type BpUpdate = Database["public"]["Tables"]["business_profiles"]["Update"];
type ProfUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type ManagerBusinessPatch = {
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  legal_name: string | null;
  tax_id: string | null;
  mobile_phone: string | null;
  notes: string | null;
};

export type ManagerProfileRowPatch = {
  full_name: string;
  phone: string | null;
  mobile_phone: string | null;
};

export async function persistManagerBusinessProfile(
  tenantId: string,
  input: ManagerBusinessPatch
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!hasServiceRoleKey()) {
    return {
      ok: false,
      error:
        "חסר SUPABASE_SERVICE_ROLE_KEY בשרת — נדרש לעדכון פרופיל העסק.",
    };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const patch: BpUpdate = {
    name: input.name.trim(),
    logo_url: input.logo_url?.trim() || null,
    primary_color: input.primary_color?.trim() || null,
    contact_email: input.contact_email?.trim() || null,
    contact_phone: input.contact_phone?.trim() || null,
    legal_name: input.legal_name?.trim() || null,
    tax_id: input.tax_id?.trim() || null,
    mobile_phone: input.mobile_phone?.trim() || null,
    notes: input.notes?.trim() || null,
    updated_at: now,
  };

  const { error } = await admin
    .from("business_profiles")
    .update(patch)
    .eq("id", tenantId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function persistManagerOwnProfileRow(
  profileId: string,
  authUserId: string,
  input: ManagerProfileRowPatch
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!hasServiceRoleKey()) {
    return {
      ok: false,
      error:
        "חסר SUPABASE_SERVICE_ROLE_KEY בשרת — נדרש לעדכון פרופיל משתמש.",
    };
  }

  const admin = createAdminClient();

  const { data: row, error: fetchErr } = await admin
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (fetchErr || !row) {
    return {
      ok: false,
      error: fetchErr?.message ?? "פרופיל משתמש לא נמצא.",
    };
  }

  const patch: ProfUpdate = {
    full_name: input.full_name.trim(),
    phone: input.phone?.trim() || null,
    mobile_phone: input.mobile_phone?.trim() || null,
  };

  const { error } = await admin
    .from("profiles")
    .update(patch)
    .eq("id", profileId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
