import type { Database } from "@my-project/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export type UnitsMutationResult =
  | { ok: true }
  | { ok: false; error: string };

export type UnitRowInput = {
  unit_number: string;
  floor_number: number | null;
};

export async function addUnitsToBuilding(
  supabase: SupabaseClient<Database>,
  scope: { businessProfileId: string },
  buildingId: string,
  rows: UnitRowInput[]
): Promise<UnitsMutationResult> {
  const trimmed = rows
    .map((r) => ({
      unit_number: r.unit_number.trim(),
      floor_number: r.floor_number,
    }))
    .filter((r) => r.unit_number.length > 0);

  if (!trimmed.length) {
    return { ok: false, error: "הוסיפו לפחות דירה אחת." };
  }

  const { data: building, error: be } = await supabase
    .from("buildings")
    .select("id, business_profile_id")
    .eq("id", buildingId)
    .maybeSingle();

  if (be || !building || building.business_profile_id !== scope.businessProfileId) {
    return { ok: false, error: "בניין לא נמצא או אין הרשאה." };
  }

  const inserts = trimmed.map((r) => ({
    business_profile_id: scope.businessProfileId,
    building_id: buildingId,
    unit_number: r.unit_number,
    floor_number: r.floor_number,
  }));

  const { error: ie } = await supabase.from("units").insert(inserts);

  if (ie) {
    return { ok: false, error: ie.message };
  }

  return { ok: true };
}

export async function linkResidentProfileToUnit(
  supabase: SupabaseClient<Database>,
  scope: { businessProfileId: string },
  buildingId: string,
  unitId: string,
  profileId: string
): Promise<UnitsMutationResult> {
  const { data: unit, error: ue } = await supabase
    .from("units")
    .select("id, building_id, business_profile_id")
    .eq("id", unitId)
    .maybeSingle();

  if (
    ue ||
    !unit ||
    unit.building_id !== buildingId ||
    unit.business_profile_id !== scope.businessProfileId
  ) {
    return { ok: false, error: "דירה לא נמצאה." };
  }

  const { data: prof, error: pe } = await supabase
    .from("profiles")
    .select("id, role, business_profile_id, unit_id, building_id")
    .eq("id", profileId)
    .maybeSingle();

  if (
    pe ||
    !prof ||
    prof.business_profile_id !== scope.businessProfileId ||
    prof.role !== "resident"
  ) {
    return { ok: false, error: "פרופיל לא נמצא או שאינו דייר." };
  }

  const buildingOk =
    prof.building_id === null || prof.building_id === buildingId;
  if (!buildingOk) {
    return {
      ok: false,
      error: "הדייר משויך לבניין אחר — יש לשחרר שיוך לפני קישור לדירה זו.",
    };
  }

  const { error: clearErr } = await supabase
    .from("profiles")
    .update({ unit_id: null })
    .eq("unit_id", unitId)
    .neq("id", profileId);

  if (clearErr) {
    return { ok: false, error: clearErr.message };
  }

  const { error: up } = await supabase
    .from("profiles")
    .update({
      unit_id: unitId,
      building_id: buildingId,
    })
    .eq("id", profileId);

  if (up) {
    return { ok: false, error: up.message };
  }

  return { ok: true };
}
