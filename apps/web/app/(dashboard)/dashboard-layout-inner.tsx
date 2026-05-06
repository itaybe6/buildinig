import { DashboardShell } from "@/components/dashboard-shell";
import { getWebConfig } from "@/lib/branding/server";
import { requireAuthProfile } from "@/lib/dashboard/session";
import type { ReactNode } from "react";

export async function DashboardLayoutInner({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireAuthProfile();
  const role = profile.role;

  const managerBrand =
    role === "manager" && profile.managerBrand ? profile.managerBrand : undefined;

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
