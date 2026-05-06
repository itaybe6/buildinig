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
    .select("full_name, role, business_profile_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profileRow) {
    redirect("/login");
  }

  const profile = profileRow as {
    full_name: string;
    role: UserRole;
    business_profile_id: string | null;
  };
  const role = profile.role;

  let managerBrand:
    | { name: string; logoUrl: string | null }
    | undefined;
  if (role === "manager" && profile.business_profile_id) {
    const { data: bp } = await supabase
      .from("business_profiles")
      .select("name, logo_url")
      .eq("id", profile.business_profile_id)
      .maybeSingle();
    if (bp) {
      managerBrand = { name: bp.name, logoUrl: bp.logo_url };
    }
  }

  const cfg = getWebConfig();
  const contentDir = cfg.dir === "ltr" ? "ltr" : "rtl";

  return (
    <DashboardShell
      role={role}
      displayName={profile.full_name}
      contentDir={contentDir}
      managerBrand={managerBrand}
    >
      {children}
    </DashboardShell>
  );
}
