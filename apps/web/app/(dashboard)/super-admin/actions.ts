"use server";

import { bootstrapBusiness } from "@/lib/super-admin/bootstrap-business";
import { requireSuperAdmin } from "@/lib/dashboard/session";
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

  const result = await bootstrapBusiness({
    name: String(formData.get("name") ?? ""),
    legalName: String(formData.get("legal_name") ?? ""),
    contactEmail: String(formData.get("contact_email") ?? ""),
    managerFullName: String(formData.get("manager_full_name") ?? ""),
    managerEmail: String(formData.get("manager_email") ?? ""),
    managerPhone: String(formData.get("manager_phone") ?? ""),
    managerPassword: String(formData.get("manager_password") ?? ""),
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const tenantId = result.tenantId;

  revalidatePath("/super-admin/dashboard");
  revalidatePath("/super-admin/tenants");
  revalidatePath("/super-admin/tenants/new");

  if (String(formData.get("next_step") ?? "").trim() === "buildings") {
    revalidatePath(`/super-admin/tenants/${tenantId}`);
    redirect(`/super-admin/tenants/${tenantId}?new_tenant=1`);
  }

  const next = safeSuperAdminRedirect(
    String(formData.get("redirect_to") ?? "")
  );
  if (next) {
    redirect(next);
  }

  return { ok: true };
}
