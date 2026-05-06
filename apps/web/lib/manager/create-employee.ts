import "server-only";

import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

export type CreateEmployeeResult =
  | { ok: true }
  | { ok: false; error: string };

function duplicateEmailMessage(msg: string): string {
  const m = msg.toLowerCase();
  if (
    m.includes("already") ||
    m.includes("registered") ||
    m.includes("exists")
  ) {
    return "כתובת האימייל כבר רשומה במערכת.";
  }
  return msg;
}

/**
 * יוצר משתמש Auth + פרופיל עובד שטח בארגון (דורש SUPABASE_SERVICE_ROLE_KEY).
 */
export async function createEmployeeForBusiness(params: {
  businessProfileId: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<CreateEmployeeResult> {
  if (!hasServiceRoleKey()) {
    return {
      ok: false,
      error:
        "חסר SUPABASE_SERVICE_ROLE_KEY בשרת — הוסיפו מפתח שירות ב-.env (נדרש ליצירת משתמש).",
    };
  }

  const admin = createAdminClient();

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

  const { error: pe } = await admin.from("profiles").insert({
    auth_user_id: authData.user.id,
    business_profile_id: params.businessProfileId,
    building_id: null,
    unit_id: null,
    full_name: params.fullName.trim(),
    phone: params.phone?.trim() || null,
    role: "employee",
    is_active: true,
  });

  if (pe) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { ok: false, error: pe.message };
  }

  return { ok: true };
}
