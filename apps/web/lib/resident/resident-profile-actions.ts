"use server";

import { requireAuthProfile } from "@/lib/dashboard/session";
import { persistManagerOwnProfileRow } from "@/lib/manager/persist-manager-profile";
import { updateResidentPasswordInternal } from "@/lib/resident/update-resident-password";
import { verifyUserPassword } from "@/lib/resident/verify-user-password";
import { revalidatePath } from "next/cache";

export async function updateResidentProfileAction(input: {
  fullName: string;
  phone: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const p = await requireAuthProfile();
  if (p.role !== "resident") {
    return { ok: false, error: "לא מורשה." };
  }

  const full_name = input.fullName.trim();
  if (!full_name) {
    return { ok: false, error: "חובה שם מלא." };
  }

  const result = await persistManagerOwnProfileRow(p.profileId, p.userId, {
    full_name,
    phone: input.phone?.trim() || null,
  });

  if (!result.ok) return result;

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateResidentPasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const p = await requireAuthProfile();
  if (p.role !== "resident") {
    return { ok: false, error: "לא מורשה." };
  }

  const newPassword = input.newPassword.trim();
  if (newPassword.length < 6) {
    return { ok: false, error: "סיסמה חדשה — לפחות 6 תווים." };
  }

  const currentOk = await verifyUserPassword(
    p.userId,
    p.profileId,
    input.currentPassword
  );
  if (!currentOk) {
    return { ok: false, error: "סיסמה נוכחית שגויה." };
  }

  const updated = await updateResidentPasswordInternal(
    p.userId,
    p.profileId,
    newPassword
  );
  if (!updated.ok) return updated;

  revalidatePath("/", "layout");
  return { ok: true };
}
