import { NoTenantNotice } from "@/components/no-tenant-notice";
import { getManagerTenantContext } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@my-project/ui-web";
import Link from "next/link";

export default async function ManagerDashboardPage() {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const { businessProfileId } = ctx;

  const [
    buildings,
    residents,
    openReqs,
    pendingPay,
    quotePending,
  ] = await Promise.all([
    supabase
      .from("buildings")
      .select("id", { count: "exact", head: true })
      .eq("business_profile_id", businessProfileId),
    supabase
      .from("unit_residents")
      .select("id", { count: "exact", head: true })
      .eq("business_profile_id", businessProfileId)
      .eq("status", "active"),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("business_profile_id", businessProfileId)
      .in("status", ["open", "assigned", "in_progress"]),
    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("business_profile_id", businessProfileId)
      .eq("status", "pending"),
    supabase
      .from("quote_requests")
      .select("id", { count: "exact", head: true })
      .eq("business_profile_id", businessProfileId)
      .eq("status", "pending"),
  ]);

  const tiles = [
    {
      label: "בניינים",
      value: buildings.count ?? 0,
      href: "/buildings",
    },
    {
      label: "דיירים פעילים",
      value: residents.count ?? 0,
      href: "/residents",
    },
    {
      label: "קריאות פתוחות / בטיפול",
      value: openReqs.count ?? 0,
      href: "/service-requests",
    },
    {
      label: "תשלומים ממתינים",
      value: pendingPay.count ?? 0,
      href: "/payments",
    },
    {
      label: "בקשות הצעה ממתינות",
      value: quotePending.count ?? 0,
      href: "/quote-requests",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">לוח בקרה</h1>
        <p className="text-sm text-muted-foreground">
          סיכום מהיר מהמערכת — לפי הארגון שלך.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href}>
            <Card className="h-full transition-colors hover:bg-accent/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{t.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{t.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
