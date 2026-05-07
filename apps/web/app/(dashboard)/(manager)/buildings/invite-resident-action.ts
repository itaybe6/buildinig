"use server";

import { getManagerTenantContext } from "@/lib/dashboard/session";
import { inviteResidentToBuilding } from "@/lib/manager/invite-resident-to-building";
import { revalidatePath } from "next/cache";

export type InviteResidentActionState =
  | { ok: true }
  | { ok: false; error: string };

export async function inviteResidentForBuildingAction(
  _prev: InviteResidentActionState | undefined,
  formData: FormData
): Promise<InviteResidentActionState> {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) {
    return { ok: false, error: "אין הרשאת מנהל או חסר פרופיל עסק." };
  }

  const buildingId = String(formData.get("building_id") ?? "").trim();
  if (!buildingId) {
    return { ok: false, error: "חסר מזהה בניין." };
  }

  const unitIdRaw = String(formData.get("unit_id") ?? "").trim();

  const result = await inviteResidentToBuilding({
    businessProfileId: ctx.businessProfileId,
    buildingId,
    fullName: String(formData.get("full_name") ?? ""),
    phoneRaw: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
    unitId: unitIdRaw || undefined,
  });

  if (!result.ok) {
    return result;
  }

  revalidatePath(`/buildings/${buildingId}`);
  revalidatePath("/dashboard");
  revalidatePath("/residents");
  return { ok: true };
}
