import { supabase } from "@/lib/supabase";
import { webApiOrigin } from "@/lib/web-api-origin";

export type ManagerBusinessApiPayload = {
  name: string;
  logo_url?: string | null;
  primary_color?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  legal_name?: string | null;
  tax_id?: string | null;
  notes?: string | null;
};

export type ManagerProfileApiPayload = {
  full_name: string;
  phone?: string | null;
};

export async function patchManagerBusinessViaWebApi(
  business: ManagerBusinessApiPayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  const origin = webApiOrigin();
  if (!origin) {
    return {
      ok: false,
      error:
        "חסר EXPO_PUBLIC_WEB_APP_ORIGIN — כתובת שרת Next (כולל פורט בפיתוח).",
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { ok: false, error: "יש להתחבר." };
  }

  const res = await fetch(`${origin}/api/manager/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ section: "business", business }),
  });

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

export async function patchManagerUserProfileViaWebApi(
  profile: ManagerProfileApiPayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  const origin = webApiOrigin();
  if (!origin) {
    return {
      ok: false,
      error:
        "חסר EXPO_PUBLIC_WEB_APP_ORIGIN — כתובת שרת Next (כולל פורט בפיתוח).",
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { ok: false, error: "יש להתחבר." };
  }

  const res = await fetch(`${origin}/api/manager/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ section: "profile", profile }),
  });

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
