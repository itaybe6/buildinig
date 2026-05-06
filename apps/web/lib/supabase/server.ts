import {
  createServerSupabaseClient,
  type CookieOptions,
} from "@my-project/supabase";
import { cookies } from "next/headers";
import { loadClientEnvOnce } from "@/lib/branding/server";

export function createClient() {
  loadClientEnvOnce();

  const cookieStore = cookies();

  return createServerSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* Server Component — sometimes the cookie store is read-only */
        }
      },
    }
  );
}
