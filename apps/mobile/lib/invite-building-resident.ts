import { supabase } from "@/lib/supabase";
import { webApiOrigin } from "@/lib/web-api-origin";

export async function inviteResidentToBuildingViaWebApi(
  buildingId: string,
  input: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
    /** קישור לדירה ספציפית בעת יצירת דייר */
    unit_id?: string;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const origin = webApiOrigin();
  if (!origin) {
    return {
      ok: false,
      error:
        "חסר EXPO_PUBLIC_WEB_APP_ORIGIN — הגדרו כתובת שרת הווב (כמו ביצירת עסק).",
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { ok: false, error: "יש להתחבר." };
  }

  const res = await fetch(
    `${origin}/api/manager/buildings/${buildingId}/residents`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        full_name: input.full_name,
        email: input.email,
        password: input.password,
        phone: input.phone ?? "",
        ...(input.unit_id ? { unit_id: input.unit_id } : {}),
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
