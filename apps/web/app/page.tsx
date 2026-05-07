import { createClient } from "@/lib/supabase/server";
import { isFieldWorkerRole, type UserRole } from "@my-project/shared";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const profile = profileRaw as { role: UserRole } | null;
  const role = profile?.role;
  if (role === "super_admin") {
    redirect("/super-admin/dashboard");
  }
  if (role === "resident") {
    redirect("/requests");
  }
  if (role && isFieldWorkerRole(role)) {
    redirect("/assignments");
  }

  redirect("/dashboard");
}
