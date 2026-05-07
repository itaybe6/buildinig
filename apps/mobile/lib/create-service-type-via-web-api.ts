import { supabase } from "@/lib/supabase";
import { webApiOrigin } from "@/lib/web-api-origin";

export async function createServiceTypeViaWebApi(input: {
  name: string;
  description?: string | null;
  category: string;
  price_min?: string | null;
  price_max?: string | null;
  price_unit?: string | null;
  is_active: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const origin = webApiOrigin();
  if (!origin) {
    return {
      ok: false,
      error:
        "חסר EXPO_PUBLIC_WEB_APP_ORIGIN — הגדרו כתובת שרת הווב.",
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { ok: false, error: "יש להתחבר." };
  }

  const res = await fetch(`${origin}/api/manager/service-types`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      name: input.name,
      description: input.description ?? null,
      category: input.category,
      price_min: input.price_min ?? null,
      price_max: input.price_max ?? null,
      price_unit: input.price_unit ?? null,
      is_active: input.is_active,
    }),
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
