import { supabase } from "@/lib/supabase";

type AppSupabase = typeof supabase;

export type CreateBusinessInput = {
  name: string;
  legal_name?: string;
  contact_email?: string;
};

/**
 * יוצר tenants + business_profiles (זהה ללוגיקת ה-web).
 */
export async function createBusinessRecords(
  client: AppSupabase,
  input: CreateBusinessInput
): Promise<{ ok: true; tenantId: string } | { ok: false; error: string }> {
  const name = input.name.trim();
  const legalName = (input.legal_name ?? "").trim();
  const contactEmail = (input.contact_email ?? "").trim();

  if (!name) {
    return { ok: false, error: "חובה להזין שם עסק." };
  }

  const { data: tenant, error: te } = await client
    .from("tenants")
    .insert({
      name,
      contact_email: contactEmail || null,
      is_active: true,
    })
    .select("id")
    .single();

  if (te || !tenant) {
    const msg = te?.message ?? "שגיאה ביצירת הארגון";
    return { ok: false, error: msg };
  }

  const { error: bpErr } = await client.from("business_profiles").insert({
    tenant_id: tenant.id,
    legal_name: legalName || null,
  });

  if (bpErr) {
    await client.from("tenants").delete().eq("id", tenant.id);
    return { ok: false, error: bpErr.message };
  }

  return { ok: true, tenantId: tenant.id };
}
