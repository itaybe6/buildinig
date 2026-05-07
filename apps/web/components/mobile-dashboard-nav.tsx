"use client";

import type { UserRole } from "@my-project/shared";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@my-project/ui-web";
import { LogoutButton } from "@/components/logout-button";
import { ResidentSidebarAccount } from "@/components/resident/resident-sidebar-account";
import { getSidebarSections, type NavItem } from "@/lib/nav";

function NavLinks({
  items,
  pathname,
  navBadges,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string | null;
  navBadges?: Record<string, number>;
  onNavigate?: () => void;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const badge = navBadges?.[item.href];
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-3 py-3 text-base transition-colors hover:bg-accent",
                pathname === item.href || pathname?.startsWith(item.href + "/")
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <span>{item.label}</span>
              {badge != null && badge > 0 ? (
                <span
                  className={cn(
                    "flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums",
                    pathname === item.href ||
                      pathname?.startsWith(item.href + "/")
                      ? "bg-primary text-primary-foreground"
                      : "bg-destructive text-destructive-foreground"
                  )}
                  aria-label={`התראות: ${badge}`}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function MobileDashboardNav({
  role,
  displayName,
  managerBrand,
  navBadges,
  residentSidebar,
}: {
  role: UserRole;
  displayName: string;
  managerBrand?: { name: string; logoUrl: string | null };
  navBadges?: Record<string, number>;
  residentSidebar?: { phone: string | null };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sections = getSidebarSections(role);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <button
          type="button"
          className="rounded-md border bg-card px-3 py-2 text-sm font-medium shadow-sm"
          onClick={() => setOpen(true)}
          aria-expanded={open}
        >
          תפריט
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-end">
          {managerBrand ? (
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <div className="min-w-0 text-end">
                <p className="truncate text-xs font-semibold text-foreground">
                  {managerBrand.name}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {displayName}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-card">
                {managerBrand.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={managerBrand.logoUrl}
                    alt=""
                    className="h-full w-full object-contain p-0.5"
                  />
                ) : (
                  <span className="text-[9px] text-muted-foreground">—</span>
                )}
              </div>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">מחובר/ת</p>
              <p className="truncate text-sm font-semibold">{displayName}</p>
            </div>
          )}
        </div>
      </header>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-50 bg-black/40 md:hidden"
            aria-label="סגירת תפריט"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 end-0 z-[60] flex w-[min(100%,20rem)] flex-col border-s bg-background shadow-lg md:hidden">
            <div className="flex h-full flex-col overflow-y-auto p-4">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="font-semibold">ניווט</p>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  סגור
                </button>
              </div>
              <nav className="flex-1 space-y-6">
                {sections.groups.map((group, idx) => (
                  <div key={idx}>
                    {group.title ? (
                      <p className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
                        {group.title}
                      </p>
                    ) : null}
                    <NavLinks
                      items={group.items}
                      pathname={pathname}
                      navBadges={navBadges}
                      onNavigate={() => setOpen(false)}
                    />
                  </div>
                ))}
                {sections.admin && sections.admin.length > 0 ? (
                  <div>
                    <p className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
                      מנהל-על
                    </p>
                    <NavLinks
                      items={sections.admin}
                      pathname={pathname}
                      navBadges={navBadges}
                      onNavigate={() => setOpen(false)}
                    />
                  </div>
                ) : null}
              </nav>
              {residentSidebar ? (
                <ResidentSidebarAccount
                  displayName={displayName}
                  phone={residentSidebar.phone}
                />
              ) : null}
              <div className="mt-4 border-t pt-4">
                <LogoutButton
                  variant="outline"
                  className="w-full"
                />
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
