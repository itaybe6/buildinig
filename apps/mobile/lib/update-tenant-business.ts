import { supabase } from "@/lib/supabase";
import { webApiOrigin } from "@/lib/web-api-origin";

export type UpdateTenantBusinessInput = {
  contact_email?: string | null;
  contact_phone?: string | null;
  plan?: string | null;
  is_active: boolean;
  legal_name?: string | null;
  tax_id?: string | null;
  business_mobile_phone?: string | null;
};

/**
 * מעדכן פרטי עסק דרך API הווב (מפתח שירות). דורש EXPO_PUBLIC_WEB_APP_ORIGIN.
 */
export async function updateTenantBusinessViaWebApi(
  tenantId: string,
  input: UpdateTenantBusinessInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const origin = webApiOrigin();
  if (!origin) {
    return {
      ok: false,
      error:
        "חסר EXPO_PUBLIC_WEB_APP_ORIGIN — הגדרו ב-app.config את כתובת שרת הווב.",
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { ok: false, error: "יש להתחבר כסופר־אדמין." };
  }

  const res = await fetch(
    `${origin}/api/super-admin/tenants/${encodeURIComponent(tenantId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        contact_email: input.contact_email ?? null,
        contact_phone: input.contact_phone ?? null,
        plan: input.plan ?? null,
        is_active: input.is_active,
        legal_name: input.legal_name ?? null,
        tax_id: input.tax_id ?? null,
        business_mobile_phone: input.business_mobile_phone ?? null,
      }),
    }
  );

  let json: { ok?: boolean; error?: string };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return { ok: false, error: "תשובה לא תקינה מהשרת." };
  }

  if (!res.ok || !json.ok) {
    return {
      ok: false,
      error: json.error ?? `שגיאת שרת (${res.status})`,
    };
  }

  return { ok: true };
}
