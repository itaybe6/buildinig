"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function SuperAdminTenantTableRow({
  tenantId,
  children,
}: {
  tenantId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <tr
      className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/super-admin/tenants/${tenantId}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/super-admin/tenants/${tenantId}`);
        }
      }}
    >
      {children}
    </tr>
  );
}
