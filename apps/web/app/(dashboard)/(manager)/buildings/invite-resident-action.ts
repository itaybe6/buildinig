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
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    unitId: unitIdRaw || undefined,
  });

  if (!result.ok) {
    return result;
  }

  revalidatePath(`/buildings/${buildingId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
