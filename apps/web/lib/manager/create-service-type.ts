import "server-only";

import { requestCategorySchema } from "@my-project/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@my-project/supabase";

export type CreateServiceTypeInput = {
  name: string;
  description?: string | null;
  category: string;
  price_min?: string | null;
  price_max?: string | null;
  price_unit?: string | null;
  is_active?: boolean | null;
};

export type CreateServiceTypeResult =
  | { ok: true }
  | { ok: false; error: string };

function normalizeNumericField(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  return s.length === 0 ? null : s;
}

export async function createServiceTypeForBusiness(
  supabase: SupabaseClient<Database>,
  businessProfileId: string,
  input: CreateServiceTypeInput
): Promise<CreateServiceTypeResult> {
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

  const { error } = await supabase.from("service_types").insert({
    business_profile_id: businessProfileId,
    name,
    description: input.description?.trim() ? input.description.trim() : null,
    category: catParse.data,
    price_min,
    price_max,
    price_unit,
    is_active: input.is_active ?? true,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
