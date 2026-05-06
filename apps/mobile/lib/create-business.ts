import { supabase } from "@/lib/supabase";

type AppSupabase = typeof supabase;

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

function uniqueOrgSlug(): string {
  const id =
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID().slice(0, 10)
      : String(Date.now());
  return `org-${id}`;
}

export type CreateBusinessInput = {
  name: string;
  slug?: string;
  legal_name?: string;
  contact_email?: string;
};

/**
 * יוצר tenants + business_profiles (זהה ללוגיקת ה-web).
 */
export async function createBusinessRecords(
  client: AppSupabase,
  input: CreateBusinessInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.name.trim();
  let slug = (input.slug ?? "").trim();
  const legalName = (input.legal_name ?? "").trim();
  const contactEmail = (input.contact_email ?? "").trim();

  if (!name) {
    return { ok: false, error: "חובה להזין שם עסק." };
  }

  if (!slug) {
    slug = slugify(name);
  } else {
    slug = slugify(slug);
  }

  if (!slug || slug.length < 2) {
    slug = uniqueOrgSlug();
  }

  const { data: tenant, error: te } = await client
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

  const { error: bpErr } = await client.from("business_profiles").insert({
    tenant_id: tenant.id,
    legal_name: legalName || null,
  });

  if (bpErr) {
    await client.from("tenants").delete().eq("id", tenant.id);
    return { ok: false, error: bpErr.message };
  }

  return { ok: true };
}
