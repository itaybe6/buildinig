"use server";

import { getManagerTenantContext } from "@/lib/dashboard/session";
import { createServiceTypeForBusiness } from "@/lib/manager/create-service-type";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CreateServiceTypeActionState =
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
