import { DashboardShell } from "@/components/dashboard-shell";
import { getWebConfig } from "@/lib/branding/server";
import {
  getManagerBrand,
  requireAuthProfile,
  type ManagerBrand,
} from "@/lib/dashboard/session";
import type { ReactNode } from "react";

export default async function DashboardGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireAuthProfile();
  const role = profile.role;

  let managerBrand: ManagerBrand | undefined;
  if (role === "manager" && profile.businessProfileId) {
    const brand = await getManagerBrand(profile.businessProfileId);
    if (brand) managerBrand = brand;
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
