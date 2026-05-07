import "server-only";

import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

export type InviteResidentResult =
  | { ok: true }
  | { ok: false; error: string };

function duplicateEmailMessage(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("already") || m.includes("registered") || m.includes("exists")) {
    return "כתובת האימייל כבר רשומה במערכת.";
  }
  return msg;
}

/**
 * יוצר משתמש Auth + פרופיל דייר; אם נבחרה דירה — מקשר ב־`units.resident_profile_id`.
 */
export async function inviteResidentToBuilding(params: {
  businessProfileId: string;
  buildingId: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  unitId?: string;
}): Promise<InviteResidentResult> {
  if (!hasServiceRoleKey()) {
    return {
      ok: false,
      error:
        "חסר SUPABASE_SERVICE_ROLE_KEY בשרת — הוסיפו מפתח שירות ב-.env (נדרש ליצירת משתמש).",
    };
  }

  const admin = createAdminClient();
  const { data: building, error: be } = await admin
    .from("buildings")
    .select("id, business_profile_id")
    .eq("id", params.buildingId)
    .maybeSingle();

  if (be || !building) {
    return { ok: false, error: "בניין לא נמצא." };
  }
  if (building.business_profile_id !== params.businessProfileId) {
    return { ok: false, error: "אין הרשאה לבניין זה." };
  }

  let resolvedUnitId: string | null = null;
  if (params.unitId) {
    const { data: unit, error: ue } = await admin
      .from("units")
      .select("id, building_id")
      .eq("id", params.unitId)
      .maybeSingle();
    if (ue || !unit) {
      return { ok: false, error: "דירה לא נמצאה." };
    }
    if (unit.building_id !== params.buildingId) {
      return { ok: false, error: "הדירה אינה שייכת לבניין זה." };
    }
    resolvedUnitId = unit.id;
    await admin
      .from("units")
      .update({ resident_profile_id: null })
      .eq("id", resolvedUnitId);
  }

  const email = params.email.trim().toLowerCase();
  if (!email) {
    return { ok: false, error: "חובה אימייל." };
  }
  if (!params.password || params.password.length < 6) {
    return { ok: false, error: "סיסמה — לפחות 6 תווים." };
  }
  if (!params.fullName.trim()) {
    return { ok: false, error: "חובה שם מלא." };
  }

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password: params.password,
    email_confirm: true,
  });

  if (authErr || !authData.user) {
    return {
      ok: false,
      error: authErr
        ? duplicateEmailMessage(authErr.message)
        : "שגיאה ביצירת משתמש.",
    };
  }

  const { data: ins, error: pe } = await admin
    .from("profiles")
    .insert({
      auth_user_id: authData.user.id,
      business_profile_id: params.businessProfileId,
      full_name: params.fullName.trim(),
      phone: params.phone?.trim() || null,
      role: "resident",
      is_active: true,
    })
    .select("id")
    .single();

  if (pe || !ins) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { ok: false, error: pe?.message ?? "שגיאת פרופיל." };
  }

  if (resolvedUnitId) {
    const { error: ue2 } = await admin
      .from("units")
      .update({ resident_profile_id: ins.id })
      .eq("id", resolvedUnitId);
    if (ue2) {
      await admin.from("profiles").delete().eq("id", ins.id);
      await admin.auth.admin.deleteUser(authData.user.id);
      return { ok: false, error: ue2.message };
    }
  }

  return { ok: true };
}
