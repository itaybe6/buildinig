"use client";

import type { UserRole } from "@my-project/shared";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useLayoutEffect } from "react";

/** מנהל-על נשאר רק תחת `/super-admin/*` — ללא עמודי ממשק המנהל */
export function SuperAdminRouteGuard({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (role !== "super_admin") return;
    if (pathname.startsWith("/super-admin")) return;
    router.replace("/super-admin/dashboard");
  }, [role, pathname, router]);

  return <>{children}</>;
}
