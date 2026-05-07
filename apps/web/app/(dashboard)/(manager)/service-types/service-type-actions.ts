"use server";

import { getManagerTenantContext } from "@/lib/dashboard/session";
import { createServiceTypeForBusiness } from "@/lib/manager/create-service-type";
import {
  deleteServiceTypeForBusiness,
  updateServiceTypeForBusiness,
} from "@/lib/manager/mutate-service-type";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CreateServiceTypeActionState =
  | { ok: true }
  | { ok: false; error: string };

export type ServiceTypeMutationState =
  | { ok: true }
  | { ok: false; error: string };

export async function createServiceTypeAction(
  _prev: CreateServiceTypeActionState | undefined,
  formData: FormData
): Promise<CreateServiceTypeActionState> {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) {
    return { ok: false, error: "אין הרשאת מנהל או חסר פרופיל עסק." };
  }
  if (ctx.profile.role !== "manager") {
    return { ok: false, error: "פעולה זו זמינה למנהלים בלבד." };
  }

  const name = String(formData.get("name") ?? "");
  const description = String(formData.get("description") ?? "");
  const category = String(formData.get("category") ?? "");
  const price_min = String(formData.get("price_min") ?? "");
  const price_max = String(formData.get("price_max") ?? "");
  const price_unit = String(formData.get("price_unit") ?? "");
  const is_active = formData.get("is_active") === "on";

  const supabase = createClient();
  const result = await createServiceTypeForBusiness(supabase, ctx.businessProfileId, {
    name,
    description: description.trim() ? description : null,
    category,
    price_min: price_min.trim() || null,
    price_max: price_max.trim() || null,
    price_unit: price_unit.trim() || null,
    is_active,
  });

  if (!result.ok) {
    return result;
  }

  revalidatePath("/service-types");
  return { ok: true };
}

export async function updateServiceTypeAction(
  _prev: ServiceTypeMutationState | undefined,
  formData: FormData
): Promise<ServiceTypeMutationState> {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) {
    return { ok: false, error: "אין הרשאת מנהל או חסר פרופיל עסק." };
  }
  if (ctx.profile.role !== "manager") {
    return { ok: false, error: "פעולה זו זמינה למנהלים בלבד." };
  }

  const id = String(formData.get("service_type_id") ?? "").trim();
  if (!id) {
    return { ok: false, error: "חסר מזהה סוג שירות." };
  }

  const supabase = createClient();
  const result = await updateServiceTypeForBusiness(supabase, ctx.businessProfileId, id, {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? ""),
    price_min: String(formData.get("price_min") ?? ""),
    price_max: String(formData.get("price_max") ?? ""),
    price_unit: String(formData.get("price_unit") ?? ""),
    is_active: formData.get("is_active") === "on",
  });

  if (!result.ok) {
    return result;
  }

  revalidatePath("/service-types");
  return { ok: true };
}

export async function deleteServiceTypeAction(
  _prev: ServiceTypeMutationState | undefined,
  formData: FormData
): Promise<ServiceTypeMutationState> {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) {
    return { ok: false, error: "אין הרשאת מנהל או חסר פרופיל עסק." };
  }
  if (ctx.profile.role !== "manager") {
    return { ok: false, error: "פעולה זו זמינה למנהלים בלבד." };
  }

  const id = String(formData.get("service_type_id") ?? "").trim();
  if (!id) {
    return { ok: false, error: "חסר מזהה סוג שירות." };
  }

  const supabase = createClient();
  const result = await deleteServiceTypeForBusiness(
    supabase,
    ctx.businessProfileId,
    id
  );

  if (!result.ok) {
    return result;
  }

  revalidatePath("/service-types");
  return { ok: true };
}
