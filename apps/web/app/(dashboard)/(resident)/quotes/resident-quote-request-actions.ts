"use server";

import { getResidentTenantContext } from "@/lib/dashboard/session";
import { getResidentBuildingOptions } from "@/lib/resident/building-options";
import { createClient } from "@/lib/supabase/server";
import { validateResidentProposedAmount } from "@my-project/shared";
import { revalidatePath } from "next/cache";

export type QuoteRequestActionState =
  | { ok: true; message: string }
  | { ok: false; message: string };

const MAX_IMAGES = 4;

function parseMediaUrlArray(formData: FormData, key: string): string[] {
  const raw = String(formData.get(key) ?? "[]").trim();
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter(
      (x): x is string => typeof x === "string" && /^https?:\/\//.test(x)
    );
  } catch {
    return [];
  }
}

export async function residentCreateQuoteRequestAction(
  _prev: QuoteRequestActionState | undefined,
  formData: FormData
): Promise<QuoteRequestActionState> {
  const ctx = await getResidentTenantContext();
  if (!ctx.ok) return { ok: false, message: "אין הרשאת תושב." };

  const description = String(formData.get("quote_description") ?? "").trim();
  const buildingId = String(formData.get("quote_building_id") ?? "").trim();
  const serviceTypeId = String(
    formData.get("quote_service_type_id") ?? ""
  ).trim();
  const amountRaw = String(formData.get("quote_proposed_amount") ?? "")
    .trim()
    .replace(",", ".");

  if (!description) {
    return { ok: false, message: "נא למלא תיאור לבקשה." };
  }
  if (!buildingId || !serviceTypeId) {
    return { ok: false, message: "חסרים נתוני בקשה." };
  }

  const proposed = Number(amountRaw);
  if (!Number.isFinite(proposed)) {
    return { ok: false, message: "נא להזין מחיר תקין." };
  }

  const supabase = createClient();
  const { data: st, error: stErr } = await supabase
    .from("service_types")
    .select("id, name, price_min, price_max, is_active, business_profile_id")
    .eq("id", serviceTypeId)
    .eq("business_profile_id", ctx.businessProfileId)
    .maybeSingle();

  if (stErr || !st) {
    return { ok: false, message: "שירות לא נמצא." };
  }
  if (st.is_active === false) {
    return { ok: false, message: "השירות אינו פעיל." };
  }

  const bounds = validateResidentProposedAmount(proposed, {
    priceMin: st.price_min,
    priceMax: st.price_max,
  });
  if (!bounds.ok) {
    return { ok: false, message: bounds.message };
  }

  const options = await getResidentBuildingOptions(supabase, {
    profileId: ctx.profile.profileId,
    businessProfileId: ctx.businessProfileId,
  });
  const match = options.find((o) => o.buildingId === buildingId);
  if (!match) {
    return { ok: false, message: "הבניין שנבחר אינו משויך לדירה שלך." };
  }

  const imageCandidates = parseMediaUrlArray(formData, "quote_image_urls_json");
  if (imageCandidates.length > MAX_IMAGES) {
    return {
      ok: false,
      message: `ניתן לצרף עד ${MAX_IMAGES} תמונות.`,
    };
  }

  const { error } = await supabase.from("quote_requests").insert({
    business_profile_id: ctx.businessProfileId,
    building_id: buildingId,
    unit_id: match.unitId,
    requested_by: ctx.profile.profileId,
    service_type_id: serviceTypeId,
    title: `הצעת מחיר — ${st.name}`,
    description,
    image_urls: imageCandidates.length ? imageCandidates : null,
    resident_proposed_amount: proposed.toFixed(2),
    status: "pending",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/quotes");
  return { ok: true, message: "הבקשה נשלחה." };
}
