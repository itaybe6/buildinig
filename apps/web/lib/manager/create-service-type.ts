import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@my-project/supabase";

export type CreateServiceTypeInput = {
  name: string;
  description?: string | null;
  price_min?: string | null;
  price_max?: string | null;
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

  const { error } = await supabase.from("service_types").insert({
    business_profile_id: businessProfileId,
    name,
    description: input.description?.trim() ? input.description.trim() : null,
    price_min,
    price_max,
    is_active: input.is_active ?? true,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
