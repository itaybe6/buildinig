"use server";

import { requireSuperAdmin } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function safeSuperAdminRedirect(path: string): string | null {
  const p = path.trim();
  if (!p.startsWith("/") || p.includes("//") || p.includes("..")) {
    return null;
  }
  if (!p.startsWith("/super-admin")) {
    return null;
  }
  return p;
}

export type CreateBusinessState =
  | { ok: true }
  | { ok: false; error: string };

export async function createBusinessAction(
  _prev: CreateBusinessState | undefined,
  formData: FormData
): Promise<CreateBusinessState> {
  await requireSuperAdmin();
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  const legalName = String(formData.get("legal_name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();

  if (!name) {
    return { ok: false, error: "חובה להזין שם עסק (שם תצוגה)." };
  }

  const { data: tenant, error: te } = await supabase
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

  const { error: bpErr } = await supabase.from("business_profiles").insert({
    tenant_id: tenant.id,
    legal_name: legalName || null,
  });

  if (bpErr) {
    await supabase.from("tenants").delete().eq("id", tenant.id);
    return { ok: false, error: bpErr.message };
  }

  revalidatePath("/super-admin/dashboard");
  revalidatePath("/super-admin/tenants");
  revalidatePath("/super-admin/tenants/new");

  if (String(formData.get("next_step") ?? "").trim() === "buildings") {
    revalidatePath(`/super-admin/tenants/${tenant.id}/buildings`);
    redirect(`/super-admin/tenants/${tenant.id}/buildings?new_tenant=1`);
  }

  const next = safeSuperAdminRedirect(
    String(formData.get("redirect_to") ?? "")
  );
  if (next) {
    redirect(next);
  }

  return { ok: true };
}
