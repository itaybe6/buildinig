"use server";

import { getManagerTenantContext } from "@/lib/dashboard/session";
import {
  addUnitsToBuilding,
  linkResidentProfileToUnit,
  type UnitRowInput,
} from "@/lib/manager/building-units-mutations";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UnitsActionState =
  | { ok: true }
  | { ok: false; error: string };

export async function addBuildingUnitsAction(
  buildingId: string,
  units: UnitRowInput[]
): Promise<UnitsActionState> {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) {
    return { ok: false, error: "אין הרשאת מנהל או חסר פרופיל עסק." };
  }

  const supabase = createClient();
  const result = await addUnitsToBuilding(
    supabase,
    { businessProfileId: ctx.businessProfileId },
    buildingId,
    units
  );

  if (!result.ok) return result;

  revalidatePath(`/buildings/${buildingId}`);
  return { ok: true };
}

export async function linkResidentToUnitAction(
  buildingId: string,
  unitId: string,
  profileId: string
): Promise<UnitsActionState> {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) {
    return { ok: false, error: "אין הרשאת מנהל או חסר פרופיל עסק." };
  }

  const supabase = createClient();
  const result = await linkResidentProfileToUnit(
    supabase,
    { businessProfileId: ctx.businessProfileId },
    buildingId,
    unitId,
    profileId
  );

  if (!result.ok) return result;

  revalidatePath(`/buildings/${buildingId}`);
  return { ok: true };
}
