import { DashboardShell } from "@/components/dashboard-shell";
import { getWebConfig } from "@/lib/branding/server";
import { requireAuthProfile } from "@/lib/dashboard/session";
import {
  countUnreadServiceRequestNotifications,
  markServiceRequestNotificationsRead,
} from "@/lib/manager/service-request-notifications";
import type { ReactNode } from "react";
import { headers } from "next/headers";

export async function DashboardLayoutInner({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireAuthProfile();
  const role = profile.role;

  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  if (role === "manager" && pathname.startsWith("/service-requests")) {
    await markServiceRequestNotificationsRead(profile.profileId);
  }

  let navBadges: Record<string, number> | undefined;
  if (role === "manager") {
    const unread = await countUnreadServiceRequestNotifications(profile.profileId);
    if (unread > 0) {
      navBadges = { "/service-requests": unread };
    }
  }

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
      navBadges={navBadges}
    >
      {children}
    </DashboardShell>
  );
}
