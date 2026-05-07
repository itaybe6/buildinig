import "server-only";

import { requestCategorySchema } from "@my-project/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@my-project/supabase";
import type { CreateServiceTypeInput } from "@/lib/manager/create-service-type";

export type MutateServiceTypeResult =
  | { ok: true }
  | { ok: false; error: string };

function normalizeNumericField(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  return s.length === 0 ? null : s;
}

export async function updateServiceTypeForBusiness(
  supabase: SupabaseClient<Database>,
  businessProfileId: string,
  serviceTypeId: string,
  input: CreateServiceTypeInput
): Promise<MutateServiceTypeResult> {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "חובה שם לשירות." };
  }

  const catParse = requestCategorySchema.safeParse(input.category);
  if (!catParse.success) {
    return { ok: false, error: "קטגוריה לא תקינה." };
  }

  const price_min = normalizeNumericField(input.price_min ?? null);
  const price_max = normalizeNumericField(input.price_max ?? null);

  if (price_min != null && price_max != null) {
    const a = Number(price_min);
    const b = Number(price_max);
    if (!Number.isNaN(a) && !Number.isNaN(b) && a > b) {
      return {
        ok: false,
        error: "מחיר מינימום לא יכול להיות גדול מהמחיר המקסימלי.",
      };
    }
  }

  const price_unit = normalizeNumericField(input.price_unit ?? null);

  const { error } = await supabase
    .from("service_types")
    .update({
      name,
      description: input.description?.trim() ? input.description.trim() : null,
      category: catParse.data,
      price_min,
      price_max,
      price_unit,
      is_active: input.is_active ?? true,
    })
    .eq("id", serviceTypeId)
    .eq("business_profile_id", businessProfileId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function deleteServiceTypeForBusiness(
  supabase: SupabaseClient<Database>,
  businessProfileId: string,
  serviceTypeId: string
): Promise<MutateServiceTypeResult> {
  const { error } = await supabase
    .from("service_types")
    .delete()
    .eq("id", serviceTypeId)
    .eq("business_profile_id", businessProfileId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
