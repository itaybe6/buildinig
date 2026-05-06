import "server-only";

import {
  normalizeIsraelPhoneLocalDigits,
  profilePhoneLookupVariants,
} from "@my-project/shared";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

export type CreateEmployeeResult =
  | { ok: true }
  | { ok: false; error: string };

function authCreateUserErrorMessage(msg: string): string {
  const m = msg.toLowerCase();
  if (
    m.includes("already") ||
    m.includes("registered") ||
    m.includes("exists") ||
    m.includes("duplicate")
  ) {
    return "מספר הטלפון כבר רשום במערכת.";
  }
  return msg;
}

/** אימייל פנימי ייחודי ל-Supabase Auth — ההתחברות למערכת היא בטלפון + סיסמה */
function syntheticAuthEmailForEmployeePhone(localPhoneDigits: string): string {
  const digits = localPhoneDigits.replace(/\D/g, "");
  return `emp.${digits}@employees.internal.invalid`;
}

/**
 * יוצר משתמש Auth + פרופיל עובד שטח בארגון (דורש SUPABASE_SERVICE_ROLE_KEY).
 * כניסה למערכת: טלפון + סיסמה (כמו /api/auth/login).
 */
export async function createEmployeeForBusiness(params: {
  businessProfileId: string;
  fullName: string;
  phoneRaw: string;
  password: string;
}): Promise<CreateEmployeeResult> {
  if (!hasServiceRoleKey()) {
    return {
      ok: false,
      error:
        "חסר SUPABASE_SERVICE_ROLE_KEY בשרת — הוסיפו מפתח שירות ב-.env (נדרש ליצירת משתמש).",
    };
  }

  const admin = createAdminClient();

  if (!params.fullName.trim()) {
    return { ok: false, error: "חובה שם מלא." };
  }

  const phoneLocal = normalizeIsraelPhoneLocalDigits(params.phoneRaw);
  if (!phoneLocal) {
    return {
      ok: false,
      error: "מספר טלפון נייד ישראלי לא תקין (למשל 050-1234567).",
    };
  }

  if (!params.password || params.password.length < 6) {
    return { ok: false, error: "סיסמה — לפחות 6 תווים." };
  }

  const phoneVariants = profilePhoneLookupVariants(params.phoneRaw);
  if (phoneVariants.length === 0) {
    return { ok: false, error: "מספר טלפון לא תקין." };
  }

  const { data: existing, error: existingErr } = await admin
    .from("profiles")
    .select("id")
    .in("phone", phoneVariants)
    .limit(1);

  if (existingErr) {
    return { ok: false, error: existingErr.message };
  }
  if (existing?.length) {
    return { ok: false, error: "מספר הטלפון כבר רשום במערכת." };
  }

  const authEmail = syntheticAuthEmailForEmployeePhone(phoneLocal);

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: authEmail,
    password: params.password,
    email_confirm: true,
  });

  if (authErr || !authData.user) {
    return {
      ok: false,
      error: authErr
        ? authCreateUserErrorMessage(authErr.message)
        : "שגיאה ביצירת משתמש.",
    };
  }

  const { error: pe } = await admin.from("profiles").insert({
    auth_user_id: authData.user.id,
    business_profile_id: params.businessProfileId,
    building_id: null,
    unit_id: null,
    full_name: params.fullName.trim(),
    phone: phoneLocal,
    role: "employee",
    is_active: true,
  });

  if (pe) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { ok: false, error: pe.message };
  }

  return { ok: true };
}
