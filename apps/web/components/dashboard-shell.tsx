"use client";

import type { UserRole } from "@my-project/shared";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@my-project/ui-web";
import { LogoutButton } from "@/components/logout-button";
import { MobileDashboardNav } from "@/components/mobile-dashboard-nav";
import { SuperAdminRouteGuard } from "@/components/super-admin-route-guard";
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
  contentDir,
  managerBrand,
  children,
}: {
  role: UserRole;
  displayName: string;
  /** כיוון מסמך מה-branding — קובע את צד סרגל הניווט (ימין בעברית RTL) */
  contentDir: "rtl" | "ltr";
  /** מנהל בלבד — שם ולוגו העסק לסרגל */
  managerBrand?: { name: string; logoUrl: string | null };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const sections = getSidebarSections(role);

  /** בריבוע RTL הסרגל מימין: פריט ראשון ב-DOM עם flex-row. ב-LTR: flex-row-reverse. */
  const shellDirection =
    contentDir === "rtl" ? "flex-row" : "flex-row-reverse";

  return (
    <div className={cn("flex min-h-screen", shellDirection)}>
      <aside className="hidden min-h-0 w-60 shrink-0 flex-col border-e bg-muted/40 p-4 md:flex">
        {managerBrand ? (
          <div className="mb-5 flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-background shadow-sm">
              {managerBrand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={managerBrand.logoUrl}
                  alt=""
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <span className="text-[10px] text-muted-foreground">לוגו</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">
                {managerBrand.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">ממשק מנהל</p>
            </div>
          </div>
        ) : null}
        <div className="mb-6 px-2">
          <p className="text-xs text-muted-foreground">מחובר/ת</p>
          <p className="truncate font-semibold">{displayName}</p>
          {role === "super_admin" ? (
            <p className="mt-1 text-xs text-muted-foreground">מנהל-על</p>
          ) : null}
        </div>
        <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto">
          {sections.groups.map((group, idx) => (
            <div key={idx}>
              {group.title ? (
                <p className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
                  {group.title}
                </p>
              ) : null}
              <NavList items={group.items} pathname={pathname} />
            </div>
          ))}
          {sections.admin && sections.admin.length > 0 ? (
            <div>
              <p className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
                מנהל-על
              </p>
              <NavList items={sections.admin} pathname={pathname} />
            </div>
          ) : null}
        </nav>
        <div className="mt-4 border-t pt-4">
          <LogoutButton className="w-full justify-start text-muted-foreground" />
        </div>
      </aside>
      <div className="flex min-h-screen min-h-0 flex-1 flex-col overflow-auto">
        <MobileDashboardNav
          role={role}
          displayName={displayName}
          managerBrand={managerBrand}
        />
        <SuperAdminRouteGuard role={role}>
          <div className="flex-1 p-4 md:p-6">{children}</div>
        </SuperAdminRouteGuard>
      </div>
    </div>
  );
}
