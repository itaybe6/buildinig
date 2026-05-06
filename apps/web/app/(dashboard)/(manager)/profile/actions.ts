"use server";

import { getManagerTenantContext, requireAuthProfile } from "@/lib/dashboard/session";
import {
  persistManagerBusinessProfile,
  persistManagerOwnProfileRow,
} from "@/lib/manager/persist-manager-profile";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ManagerBusinessActionState =
  | { ok: true }
  | { ok: false; error: string };

export type ManagerUserProfileActionState =
  | { ok: true }
  | { ok: false; error: string };

export async function updateManagerBusinessAction(
  _prev: ManagerBusinessActionState | undefined,
  formData: FormData
): Promise<ManagerBusinessActionState> {
  const auth = await requireAuthProfile();
  if (auth.role !== "manager") {
    redirect("/dashboard");
  }

  const ctx = await getManagerTenantContext();
  if (!ctx.ok) {
    return { ok: false, error: "חסר ארגון פעיל או פרופיל עסק." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { ok: false, error: "חובה למלא שם עסק." };
  }

  const result = await persistManagerBusinessProfile(ctx.tenantId, {
    name,
    logo_url: String(formData.get("logo_url") ?? "").trim() || null,
    primary_color: String(formData.get("primary_color") ?? "").trim() || null,
    contact_email: String(formData.get("contact_email") ?? "").trim() || null,
    contact_phone: String(formData.get("contact_phone") ?? "").trim() || null,
    legal_name: String(formData.get("legal_name") ?? "").trim() || null,
    tax_id: String(formData.get("tax_id") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/settings/tenant");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateManagerUserProfileAction(
  _prev: ManagerUserProfileActionState | undefined,
  formData: FormData
): Promise<ManagerUserProfileActionState> {
  const auth = await requireAuthProfile();
  if (auth.role !== "manager") {
    redirect("/dashboard");
  }

  const ctx = await getManagerTenantContext();
  if (!ctx.ok) {
    return { ok: false, error: "חסר ארגון פעיל או פרופיל עסק." };
  }

  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) {
    return { ok: false, error: "חובה למלא שם מלא." };
  }

  const result = await persistManagerOwnProfileRow(auth.profileId, auth.userId, {
    full_name,
    phone: String(formData.get("phone") ?? "").trim() || null,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { ok: true };
}
