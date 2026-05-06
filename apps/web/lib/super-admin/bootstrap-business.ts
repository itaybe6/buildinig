import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

export type BootstrapBusinessInput = {
  name: string;
  legalName: string;
  contactEmail: string;
  managerFullName: string;
  managerEmail: string;
  managerPhone: string;
  managerPassword: string;
};

export type BootstrapBusinessResult =
  | { ok: true; tenantId: string }
  | { ok: false; error: string };

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function authErrorMessage(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("already") || m.includes("registered") || m.includes("exists")) {
    return "כתובת האימייל של המנהל כבר רשומה במערכת — השתמשו באימייל אחר.";
  }
  return msg;
}

/**
 * יוצר שורת business_profiles (הארגון), משתמש Auth למנהל, ורשומת profiles.
 * דורש SUPABASE_SERVICE_ROLE_KEY בשרת.
 */
export async function bootstrapBusiness(
  input: BootstrapBusinessInput
): Promise<BootstrapBusinessResult> {
  if (!hasServiceRoleKey()) {
    return {
      ok: false,
      error:
        "חסר SUPABASE_SERVICE_ROLE_KEY בשרת — הוסיפו מפתח שירות ב-.env של האפליקציה (נדרש ליצירת משתמש מנהל).",
    };
  }

  const name = input.name.trim();
  const legalName = input.legalName.trim();
  const contactEmail = input.contactEmail.trim();
  const managerFullName = input.managerFullName.trim();
  const managerEmail = input.managerEmail.trim().toLowerCase();
  const managerPhone = input.managerPhone.trim();
  const managerPassword = input.managerPassword;

  if (!name) {
    return { ok: false, error: "חובה להזין שם עסק (שם תצוגה)." };
  }
  if (!managerFullName) {
    return { ok: false, error: "חובה להזין שם מלא למנהל." };
  }
  if (!managerEmail || !validateEmail(managerEmail)) {
    return { ok: false, error: "חובה להזין אימייל תקין למנהל." };
  }
  if (!managerPassword || managerPassword.length < 6) {
    return {
      ok: false,
      error: "סיסמת המנהל חייבת להכיל לפחות 6 תווים.",
    };
  }

  const admin = createAdminClient();

  const { data: bp, error: bpe } = await admin
    .from("business_profiles")
    .insert({
      name,
      contact_email: contactEmail || null,
      is_active: true,
      legal_name: legalName || null,
    })
    .select("id")
    .single();

  if (bpe || !bp) {
    return { ok: false, error: bpe?.message ?? "שגיאה ביצירת פרופיל העסק." };
  }

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: managerEmail,
    password: managerPassword,
    email_confirm: true,
  });

  if (authErr || !authData.user) {
    await admin.from("business_profiles").delete().eq("id", bp.id);
    return {
      ok: false,
      error: authErr
        ? authErrorMessage(authErr.message)
        : "שגיאה ביצירת משתמש המנהל.",
    };
  }

  const { error: pe } = await admin.from("profiles").insert({
    auth_user_id: authData.user.id,
    business_profile_id: bp.id,
    full_name: managerFullName,
    phone: managerPhone || null,
    role: "manager",
    is_active: true,
  });

  if (pe) {
    await admin.auth.admin.deleteUser(authData.user.id);
    await admin.from("business_profiles").delete().eq("id", bp.id);
    return { ok: false, error: pe.message };
  }

  return { ok: true, tenantId: bp.id };
}
