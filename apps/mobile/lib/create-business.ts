import Constants from "expo-constants";
import { supabase } from "@/lib/supabase";

export type CreateBusinessInput = {
  name: string;
  legal_name?: string;
  contact_email?: string;
  manager_full_name: string;
  manager_email: string;
  manager_phone?: string;
  manager_password: string;
};

function webApiOrigin(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_WEB_APP_ORIGIN?.trim();
  const fromExtra =
    (
      Constants.expoConfig?.extra as
        | { EXPO_PUBLIC_WEB_APP_ORIGIN?: string }
        | undefined
    )?.EXPO_PUBLIC_WEB_APP_ORIGIN?.trim() ?? null;
  const origin = fromEnv || fromExtra;
  return origin ? origin.replace(/\/$/, "") : null;
}

/**
 * יוצר עסק + מנהל דרך API של אפליקציית הווב (דורש SUPABASE_SERVICE_ROLE_KEY בשרת).
 * דורש EXPO_PUBLIC_WEB_APP_ORIGIN — כתובת בסיס של שרת Next (כולל פורט בפיתוח).
 */
export async function createBusinessRecords(
  input: CreateBusinessInput
): Promise<{ ok: true; tenantId: string } | { ok: false; error: string }> {
  const origin = webApiOrigin();
  if (!origin) {
    return {
      ok: false,
      error:
        "חסר EXPO_PUBLIC_WEB_APP_ORIGIN — הגדרו ב-app.config את כתובת שרת הווב (למשל http://192.168.x.x:3000).",
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { ok: false, error: "יש להתחבר כסופר־אדמין." };
  }

  const res = await fetch(`${origin}/api/super-admin/create-business`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      name: input.name,
      legal_name: input.legal_name ?? "",
      contact_email: input.contact_email ?? "",
      manager_full_name: input.manager_full_name,
      manager_email: input.manager_email,
      manager_phone: input.manager_phone ?? "",
      manager_password: input.manager_password,
    }),
  });

  let json: { ok?: boolean; tenantId?: string; error?: string };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return { ok: false, error: "תשובה לא תקינה מהשרת." };
  }

  if (!res.ok || !json.ok || !json.tenantId) {
    return {
      ok: false,
      error: json.error ?? `שגיאת שרת (${res.status})`,
    };
  }

  return { ok: true, tenantId: json.tenantId };
}
