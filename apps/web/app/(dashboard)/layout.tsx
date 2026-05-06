import { DashboardShell } from "@/components/dashboard-shell";
import { getWebConfig } from "@/lib/branding/server";
import { requireAuthProfile } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import type { ReactNode } from "react";

export default async function DashboardGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireAuthProfile();
  const role = profile.role;

  let managerBrand:
    | { name: string; logoUrl: string | null }
    | undefined;
  if (role === "manager" && profile.businessProfileId) {
    const supabase = createClient();
    const { data: bp } = await supabase
      .from("business_profiles")
      .select("name, logo_url")
      .eq("id", profile.businessProfileId)
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
      displayName={profile.fullName}
      contentDir={contentDir}
      managerBrand={managerBrand}
    >
      {children}
    </DashboardShell>
  );
}
