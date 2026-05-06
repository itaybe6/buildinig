import { supabase } from "@/lib/supabase";
import { webApiOrigin } from "@/lib/web-api-origin";

async function authHeaders(): Promise<
  { ok: true; headers: HeadersInit } | { ok: false; error: string }
> {
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

  return {
    ok: true,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
  };
}

export async function postBuildingUnitsViaWebApi(
  buildingId: string,
  units: Array<{ unit_number: string; floor_number: number | null }>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const origin = webApiOrigin();
  if (!origin) {
    return {
      ok: false,
      error:
        "חסר EXPO_PUBLIC_WEB_APP_ORIGIN — הגדרו כתובת שרת הווב.",
    };
  }

  const originResult = await authHeaders();
  if (!originResult.ok) return originResult;

  const res = await fetch(`${origin}/api/manager/buildings/${buildingId}/units`, {
    method: "POST",
    headers: originResult.headers,
    body: JSON.stringify({ units }),
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

export async function linkResidentToUnitViaWebApi(
  buildingId: string,
  unitId: string,
  profileId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const origin = webApiOrigin();
  if (!origin) {
    return {
      ok: false,
      error:
        "חסר EXPO_PUBLIC_WEB_APP_ORIGIN — הגדרו כתובת שרת הווב.",
    };
  }

  const originResult = await authHeaders();
  if (!originResult.ok) return originResult;

  const res = await fetch(
    `${origin}/api/manager/buildings/${buildingId}/units/${unitId}/link`,
    {
      method: "POST",
      headers: originResult.headers,
      body: JSON.stringify({ profile_id: profileId }),
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
