import "server-only";

import {
  normalizeIsraelPhoneLocalDigits,
  profilePhoneLookupVariants,
} from "@my-project/shared";
import type { Database } from "@my-project/supabase";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type MutateEmployeeResult =
  | { ok: true }
  | { ok: false; error: string };

/** אימייל פנימי ל-Supabase Auth — כמו ב-create-employee */
function syntheticAuthEmailForEmployeePhone(localPhoneDigits: string): string {
  const digits = localPhoneDigits.replace(/\D/g, "");
  return `emp.${digits}@employees.internal.invalid`;
}

const FIELD_STAFF_ROLES = ["cleaner", "gardener", "employee"] as const;

export type UpdatableEmployeeRole = (typeof FIELD_STAFF_ROLES)[number];

async function loadFieldStaffProfile(
  admin: ReturnType<typeof createAdminClient>,
  businessProfileId: string,
  employeeProfileId: string
): Promise<
  | {
      ok: true;
      row: {
        id: string;
        auth_user_id: string | null;
        role: string;
        phone: string | null;
      };
    }
  | { ok: false; error: string }
> {
  const { data, error } = await admin
    .from("profiles")
    .select("id, auth_user_id, role, phone")
    .eq("id", employeeProfileId)
    .eq("business_profile_id", businessProfileId)
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "עובד לא נמצא.",
    };
  }

  if (!(FIELD_STAFF_ROLES as readonly string[]).includes(data.role)) {
    return { ok: false, error: "לא ניתן לערוך משתמש זה." };
  }

  return { ok: true, row: data };
}

export async function updateEmployeeForBusiness(params: {
  businessProfileId: string;
  employeeProfileId: string;
  fullName: string;
  phoneRaw: string;
  fieldRole: UpdatableEmployeeRole;
  isActive: boolean;
  newPassword?: string;
}): Promise<MutateEmployeeResult> {
  if (!hasServiceRoleKey()) {
    return {
      ok: false,
      error:
        "חסר SUPABASE_SERVICE_ROLE_KEY בשרת — נדרש לעדכון עובד.",
    };
  }

  const admin = createAdminClient();

  const loaded = await loadFieldStaffProfile(
    admin,
    params.businessProfileId,
    params.employeeProfileId
  );
  if (!loaded.ok) return loaded;

  const fullName = params.fullName.trim();
  if (!fullName) {
    return { ok: false, error: "חובה שם מלא." };
  }

  const phoneLocal = normalizeIsraelPhoneLocalDigits(params.phoneRaw);
  if (!phoneLocal) {
    return {
      ok: false,
      error: "מספר טלפון נייד ישראלי לא תקין (למשל 050-1234567).",
    };
  }

  const pwd = params.newPassword?.trim() ?? "";
  if (pwd.length > 0 && pwd.length < 6) {
    return { ok: false, error: "סיסמה — לפחות 6 תווים." };
  }

  const phoneVariants = profilePhoneLookupVariants(params.phoneRaw);
  if (phoneVariants.length === 0) {
    return { ok: false, error: "מספר טלפון לא תקין." };
  }

  const { data: dup, error: dupErr } = await admin
    .from("profiles")
    .select("id")
    .in("phone", phoneVariants)
    .neq("id", params.employeeProfileId)
    .limit(1);

  if (dupErr) {
    return { ok: false, error: dupErr.message };
  }
  if (dup?.length) {
    return { ok: false, error: "מספר הטלפון כבר רשום במערכת." };
  }

  const prevLocalNorm = loaded.row.phone
    ? normalizeIsraelPhoneLocalDigits(loaded.row.phone)
    : null;
  const phoneChanged = (prevLocalNorm ?? "") !== phoneLocal;

  let passwordHash: string | undefined;
  if (pwd.length >= 6) {
    passwordHash = await bcrypt.hash(pwd, 10);
  }

  const authEmail = syntheticAuthEmailForEmployeePhone(phoneLocal);

  const patch: ProfileUpdate = {
    full_name: fullName,
    phone: phoneLocal,
    role: params.fieldRole as Database["public"]["Enums"]["user_role"],
    is_active: params.isActive,
  };
  if (passwordHash !== undefined) {
    patch.password_hash = passwordHash;
  }

  const { error: upErr } = await admin
    .from("profiles")
    .update(patch)
    .eq("id", params.employeeProfileId);

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  const authId = loaded.row.auth_user_id;
  if (authId) {
    const authUpdate: { email?: string; password?: string } = {};
    if (phoneChanged) {
      authUpdate.email = authEmail;
    }
    if (pwd.length >= 6) {
      authUpdate.password = pwd;
    }

    if (Object.keys(authUpdate).length > 0) {
      const { error: authErr } = await admin.auth.admin.updateUserById(
        authId,
        authUpdate
      );
      if (authErr) {
        return { ok: false, error: authErr.message };
      }
    }
  }

  return { ok: true };
}

export async function deleteEmployeeForBusiness(params: {
  businessProfileId: string;
  employeeProfileId: string;
}): Promise<MutateEmployeeResult> {
  if (!hasServiceRoleKey()) {
    return {
      ok: false,
      error:
        "חסר SUPABASE_SERVICE_ROLE_KEY בשרת — נדרש למחיקת עובד.",
    };
  }

  const admin = createAdminClient();

  const loaded = await loadFieldStaffProfile(
    admin,
    params.businessProfileId,
    params.employeeProfileId
  );
  if (!loaded.ok) return loaded;

  const authId = loaded.row.auth_user_id;

  const { error: delProfileErr } = await admin
    .from("profiles")
    .delete()
    .eq("id", params.employeeProfileId);

  if (delProfileErr) {
    return { ok: false, error: delProfileErr.message };
  }

  if (authId) {
    const { error: delAuthErr } = await admin.auth.admin.deleteUser(authId);
    if (delAuthErr) {
      return { ok: false, error: delAuthErr.message };
    }
  }

  return { ok: true };
}
