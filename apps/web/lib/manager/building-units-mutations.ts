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
    .select("id, building_id")
    .eq("id", unitId)
    .maybeSingle();

  const { data: bld, error: be } = await supabase
    .from("buildings")
    .select("business_profile_id")
    .eq("id", buildingId)
    .maybeSingle();

  if (
    ue ||
    be ||
    !unit ||
    !bld ||
    unit.building_id !== buildingId ||
    bld.business_profile_id !== scope.businessProfileId
  ) {
    return { ok: false, error: "דירה לא נמצאה." };
  }

  const { data: prof, error: pe } = await supabase
    .from("profiles")
    .select("id, role, business_profile_id")
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

  const { error: clearProfileErr } = await supabase
    .from("units")
    .update({ resident_profile_id: null })
    .eq("resident_profile_id", profileId);

  if (clearProfileErr) {
    return { ok: false, error: clearProfileErr.message };
  }

  const { error: clearUnitErr } = await supabase
    .from("units")
    .update({ resident_profile_id: null })
    .eq("id", unitId);

  if (clearUnitErr) {
    return { ok: false, error: clearUnitErr.message };
  }

  const { error: up } = await supabase
    .from("units")
    .update({ resident_profile_id: profileId })
    .eq("id", unitId);

  if (up) {
    return { ok: false, error: up.message };
  }

  return { ok: true };
}
