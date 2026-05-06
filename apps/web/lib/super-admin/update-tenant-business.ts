import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import type { Database } from "@my-project/supabase";

type BpUpdate = Database["public"]["Tables"]["business_profiles"]["Update"];

export type UpdateTenantBusinessInput = {
  /** מזהה business_profiles (נשמר בשם tenantId בתאימות לנתיבים קיימים) */
  tenantId: string;
  contact_email: string | null;
  contact_phone: string | null;
  plan: string | null;
  is_active: boolean;
  legal_name: string | null;
  tax_id: string | null;
};

export type UpdateTenantBusinessResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * עדכון פרטי עסק בטבלת business_profiles בלבד. דורש מפתח שירות בשרת.
 */
export async function updateTenantBusiness(
  input: UpdateTenantBusinessInput
): Promise<UpdateTenantBusinessResult> {
  if (!hasServiceRoleKey()) {
    return {
      ok: false,
      error:
        "חסר SUPABASE_SERVICE_ROLE_KEY בשרת — נדרש לעדכון רשומות לקוח.",
    };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const patch: BpUpdate = {
    contact_email: input.contact_email,
    contact_phone: input.contact_phone,
    plan: input.plan,
    is_active: input.is_active,
    legal_name: input.legal_name,
    tax_id: input.tax_id,
    updated_at: now,
  };

  const { error } = await admin
    .from("business_profiles")
    .update(patch)
    .eq("id", input.tenantId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
