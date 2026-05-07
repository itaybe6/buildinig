import { NoTenantNotice } from "@/components/no-tenant-notice";
import { countUnitsByBuildingId } from "@/lib/building-unit-helpers";
import { getManagerTenantContext } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import Link from "next/link";

export default async function ManagerDashboardPage() {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const { businessProfileId } = ctx;

  const buildingRows = await supabase
    .from("buildings")
    .select("id, address, city, floors_count, is_active")
    .eq("business_profile_id", businessProfileId)
    .order("address");

  const buildingIds = buildingRows.data?.map((b) => b.id) ?? [];

  const [buildingsCount, openReqs, pendingPay, quotePending, unitRowsRes] =
    await Promise.all([
      supabase
        .from("buildings")
        .select("id", { count: "exact", head: true })
        .eq("business_profile_id", businessProfileId),
      supabase
        .from("service_requests")
        .select("id, buildings!inner(business_profile_id)", {
          count: "exact",
          head: true,
        })
        .eq("buildings.business_profile_id", businessProfileId)
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
      buildingIds.length > 0
        ? supabase
            .from("units")
            .select("building_id")
            .in("building_id", buildingIds)
        : Promise.resolve({ data: [] as { building_id: string }[], error: null }),
    ]);

  const unitRows =
    unitRowsRes.error || !unitRowsRes.data ? [] : unitRowsRes.data;
  const unitCountByBuilding = countUnitsByBuildingId(unitRows);

  const tiles = [
    {
      label: "בניינים",
      value: buildingsCount.count ?? 0,
      href: "/buildings",
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">הבניינים שלך</CardTitle>
          <CardDescription>
            לחיצה על בניין פותחת פרטים, דירות ודיירים (
            <code className="rounded bg-muted px-1 text-xs">
              units.resident_profile_id
            </code>
            ).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!buildingRows.data?.length ? (
            <p className="text-sm text-muted-foreground">
              אין בניינים — נוספים על ידי סופר־אדמין או דרך הגדרות העסק.
            </p>
          ) : (
            <div className="divide-y rounded-lg border">
              {buildingRows.data.map((b) => (
                <Link
                  key={b.id}
                  href={`/buildings/${b.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-sm transition-colors hover:bg-accent/40"
                >
                  <span className="font-medium text-primary">{b.address}</span>
                  <span className="text-muted-foreground">{b.city}</span>
                  <span className="tabular-nums text-muted-foreground">
                    קומות: {b.floors_count}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    דירות: {unitCountByBuilding.get(b.id) ?? 0}
                  </span>
                  <span>{b.is_active ? "פעיל" : "לא פעיל"}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
