import { DashboardShell } from "@/components/dashboard-shell";
import { getWebConfig } from "@/lib/branding/server";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@my-project/shared";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function DashboardGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profileRow) {
    redirect("/login");
  }

  const profile = profileRow as { full_name: string; role: UserRole };
  const role = profile.role;

  if (role === "resident") {
    redirect("/unauthorized");
  }

  const cfg = getWebConfig();
  const contentDir = cfg.dir === "ltr" ? "ltr" : "rtl";

  return (
    <DashboardShell
      role={role}
      displayName={profile.full_name}
      contentDir={contentDir}
    >
      {children}
    </DashboardShell>
  );
}
