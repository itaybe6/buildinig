import type { Database } from "@my-project/supabase";
import { createClient } from "@supabase/supabase-js";

export type ResidentBearerScope = {
  userId: string;
  profileId: string;
};

/** JWT Bearer — דייר בלבד (ממשק API למובייל) */
export async function resolveResidentBearerScope(
  req: Request
): Promise<ResidentBearerScope | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const authHeader = req.headers.get("authorization");
  const token =
    authHeader?.startsWith("Bearer ") || authHeader?.startsWith("bearer ")
      ? authHeader.slice(7)
      : null;
  if (!token) return null;

  const supabase = createClient<Database>(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "resident") {
    return null;
  }

  return {
    userId: user.id,
    profileId: profile.id,
  };
}
