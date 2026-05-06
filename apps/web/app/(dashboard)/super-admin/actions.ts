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

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

function uniqueOrgSlug(): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 10)
      : String(Date.now());
  return `org-${id}`;
}

export async function createBusinessAction(
  _prev: CreateBusinessState | undefined,
  formData: FormData
): Promise<CreateBusinessState> {
  await requireSuperAdmin();
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim();
  const legalName = String(formData.get("legal_name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();

  if (!name) {
    return { ok: false, error: "חובה להזין שם עסק (שם תצוגה)." };
  }

  if (!slug) {
    slug = slugify(name);
  } else {
    slug = slugify(slug);
  }

  if (!slug || slug.length < 2) {
    slug = uniqueOrgSlug();
  }

  const { data: tenant, error: te } = await supabase
    .from("tenants")
    .insert({
      name,
      slug,
      contact_email: contactEmail || null,
      is_active: true,
    })
    .select("id")
    .single();

  if (te || !tenant) {
    const msg = te?.message ?? "שגיאה ביצירת הארגון";
    if (
      msg.includes("duplicate") ||
      msg.includes("unique") ||
      te?.code === "23505"
    ) {
      return { ok: false, error: "מזהה slug כבר קיים — בחרו מזהה אחר." };
    }
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

  const next = safeSuperAdminRedirect(
    String(formData.get("redirect_to") ?? "")
  );
  if (next) {
    redirect(next);
  }

  return { ok: true };
}
