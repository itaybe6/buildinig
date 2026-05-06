"use client";

import type { UserRole } from "@my-project/shared";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@my-project/ui-web";
import { getSidebarSections, type NavItem } from "@/lib/nav";

function NavList({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string | null;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
              pathname === item.href || pathname?.startsWith(item.href + "/")
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground"
            )}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function DashboardShell({
  role,
  displayName,
  children,
}: {
  role: UserRole;
  displayName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const sections = getSidebarSections(role);

  return (
    <div className="flex min-h-screen flex-row-reverse">
      <aside className="hidden w-60 shrink-0 border-e bg-muted/40 p-4 md:block">
        <div className="mb-6 px-2">
          <p className="text-xs text-muted-foreground">מחובר/ת</p>
          <p className="truncate font-semibold">{displayName}</p>
        </div>
        <nav className="space-y-6">
          <NavList items={sections.primary} pathname={pathname} />
          {sections.admin && sections.admin.length > 0 ? (
            <div>
              <p className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
                מנהל-על
              </p>
              <NavList items={sections.admin} pathname={pathname} />
            </div>
          ) : null}
        </nav>
      </aside>
      <div className="min-h-screen flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}
