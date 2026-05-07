import "server-only";

import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";

export async function updateResidentPasswordInternal(
  authUserId: string,
  profileId: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!hasServiceRoleKey()) {
    return {
      ok: false,
      error:
        "חסר SUPABASE_SERVICE_ROLE_KEY בשרת — נדרש לעדכון סיסמה.",
    };
  }

  const admin = createAdminClient();

  const { error: authErr } = await admin.auth.admin.updateUserById(authUserId, {
    password: newPassword,
  });

  if (authErr) {
    return { ok: false, error: authErr.message };
  }

  const hash = await bcrypt.hash(newPassword, 10);
  const { error: dbErr } = await admin
    .from("profiles")
    .update({ password_hash: hash })
    .eq("id", profileId)
    .eq("auth_user_id", authUserId);

  if (dbErr) {
    return { ok: false, error: dbErr.message };
  }

  return { ok: true };
}
