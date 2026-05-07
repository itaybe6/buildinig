import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@my-project/supabase";

/** אימות סיסמה נוכחית לפני שינוי — bcrypt אם קיים בפרופיל, אחרת התחברות ל-Auth */
export async function verifyUserPassword(
  authUserId: string,
  profileId: string,
  password: string
): Promise<boolean> {
  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("password_hash")
    .eq("id", profileId)
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error || !profile) return false;

  if (profile.password_hash) {
    return bcrypt.compare(password, profile.password_hash);
  }

  const { data: userData, error: userErr } =
    await admin.auth.admin.getUserById(authUserId);
  const email = userData.user?.email;
  if (userErr || !email) return false;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return false;

  const supabase = createClient<Database>(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: signErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return !signErr;
}
