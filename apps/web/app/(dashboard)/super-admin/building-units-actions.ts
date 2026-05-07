"use server";

import { requireSuperAdmin } from "@/lib/dashboard/session";
import {
  addUnitsToBuilding,
  type UnitRowInput,
} from "@/lib/manager/building-units-mutations";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UnitsActionState =
  | { ok: true }
  | { ok: false; error: string };

export async function addBuildingUnitsSuperAdminAction(
  tenantId: string,
  buildingId: string,
  units: UnitRowInput[]
): Promise<UnitsActionState> {
  await requireSuperAdmin();

  const supabase = createClient();
  const result = await addUnitsToBuilding(
    supabase,
    { businessProfileId: tenantId },
    buildingId,
    units
  );

  if (!result.ok) return result;

  revalidatePath(`/super-admin/tenants/${tenantId}/buildings/${buildingId}`);
  revalidatePath(`/super-admin/tenants/${tenantId}`);
  revalidatePath(`/buildings/${buildingId}`);
  return { ok: true };
}
