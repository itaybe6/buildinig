import { DashboardShellFallback } from "@/components/dashboard-shell-fallback";
import { getWebConfig } from "@/lib/branding/server";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { DashboardLayoutInner } from "./dashboard-layout-inner";

/**
 * Layout סינכרוני + Suspense: ה-fallback מוצג מיד בניווט, בזמן ש-requireAuthProfile
 * וה-shell האמיתי נטענים ברקע (בלי "מסך ריק" של שניות).
 */
export default function DashboardGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cfg = getWebConfig();
  const contentDir = cfg.dir === "ltr" ? "ltr" : "rtl";

  return (
    <Suspense fallback={<DashboardShellFallback contentDir={contentDir} />}>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}
