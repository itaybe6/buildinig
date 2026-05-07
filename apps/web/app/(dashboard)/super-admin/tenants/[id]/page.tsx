import { SuperAdminAddBuildingForm } from "@/components/super-admin/add-building-form";
import { EditTenantBusinessForm } from "@/components/super-admin/edit-tenant-business-form";
import { requireSuperAdmin } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import { groupUnitNumbersByBuildingId } from "@/lib/building-unit-helpers";
import type { Database } from "@my-project/supabase";
import { formatILS } from "@my-project/shared";
import Link from "next/link";
import { notFound } from "next/navigation";

type BuildingRow = Pick<
  Database["public"]["Tables"]["buildings"]["Row"],
  "id" | "address" | "city" | "floors_count" | "committee_fee" | "is_active"
>;

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function SuperAdminTenantDetailPage(props: PageProps) {
  const params = await Promise.resolve(props.params);
  const searchParams = await Promise.resolve(props.searchParams ?? {});

  await requireSuperAdmin();
  const supabase = createClient();

  const { data: tenant, error: te } = await supabase
    .from("business_profiles")
    .select(
      `
      id,
      name,
      contact_email,
      contact_phone,
      plan,
      is_active,
      created_at,
      legal_name,
      tax_id
    `
    )
    .eq("id", params.id)
    .maybeSingle();

  if (te) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>שגיאה</CardTitle>
          <CardDescription>{te.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!tenant) notFound();

  const tenantRow =
    tenant as Database["public"]["Tables"]["business_profiles"]["Row"];
  const legalName = tenantRow.legal_name;
  const taxId = tenantRow.tax_id;
  const [
    managersRes,
    buildingsListRes,
    buildingsCountRes,
    requestsCountRes,
    openRequestsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone, is_active")
      .eq("role", "manager")
      .eq("business_profile_id", params.id)
      .order("full_name"),
    supabase
      .from("buildings")
      .select("id, address, city, floors_count, committee_fee, is_active, created_at")
      .eq("business_profile_id", params.id)
      .order("address"),
    supabase
      .from("buildings")
      .select("id", { count: "exact", head: true })
      .eq("business_profile_id", params.id),
    supabase
      .from("service_requests")
      .select("id, buildings!inner(business_profile_id)", {
        count: "exact",
        head: true,
      })
      .eq("buildings.business_profile_id", params.id),
    supabase
      .from("service_requests")
      .select("id, buildings!inner(business_profile_id)", {
        count: "exact",
        head: true,
      })
      .eq("buildings.business_profile_id", params.id)
      .in("status", ["open", "assigned", "in_progress"]),
  ]);

  const managers = managersRes.data ?? [];
  const managersError = managersRes.error;
  const buildings = buildingsListRes.data;
  const buildingsError = buildingsListRes.error;

  const tenantBuildingIds = (buildings ?? []).map((b) => b.id);

  const unitsCountRes =
    tenantBuildingIds.length > 0
      ? await supabase
          .from("units")
          .select("id", { count: "exact", head: true })
          .in("building_id", tenantBuildingIds)
      : { count: 0, error: null };

  const unitsListRes =
    tenantBuildingIds.length > 0
      ? await supabase
          .from("units")
          .select("building_id, unit_number")
          .in("building_id", tenantBuildingIds)
      : { data: [], error: null };

  const unitsByBuildingId = groupUnitNumbersByBuildingId(
    (unitsListRes.data ?? []) as { building_id: string; unit_number: string }[],
  );

  const showNewTenantHint =
    searchParams.new_tenant === "1" || searchParams.new_tenant === "true";

  const statTiles = [
    { label: "בניינים", value: buildingsCountRes.count ?? 0 },
    { label: "דירות", value: unitsCountRes.count ?? 0 },
    { label: "קריאות שירות", value: requestsCountRes.count ?? 0 },
    { label: "קריאות פתוחות", value: openRequestsRes.count ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            בקרה על עסק — {tenantRow.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            סקירה, נתונים וניהול בניינים עבור לקוח זה.
          </p>
        </div>
        <Link
          href="/super-admin/tenants"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          חזרה ללקוחות
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statTiles.map((t) => (
          <Card key={t.label} className="shadow-none">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 pt-0">
              <p className="text-2xl font-semibold tabular-nums">{t.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">פרטי עסק</CardTitle>
            <CardDescription>
              נתונים מטבלת business_profiles (עסק מאוחד)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">אימייל: </span>
              {tenantRow.contact_email ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">טלפון: </span>
              {tenantRow.contact_phone ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">שם משפטי: </span>
              {legalName ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">ח״פ / עוסק: </span>
              {taxId ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">תוכנית: </span>
              {tenantRow.plan ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">פעיל: </span>
              {tenantRow.is_active ? "כן" : "לא"}
            </p>
            <p>
              <span className="text-muted-foreground">נוצר: </span>
              {tenantRow.created_at
                ? new Date(tenantRow.created_at).toLocaleDateString("he-IL")
                : "—"}
            </p>
            <EditTenantBusinessForm
              tenantId={params.id}
              defaults={{
                contact_email: tenantRow.contact_email,
                contact_phone: tenantRow.contact_phone,
                legal_name: legalName,
                tax_id: taxId,
                plan: tenantRow.plan,
                is_active: tenantRow.is_active,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">מנהלים משויכים</CardTitle>
            <CardDescription>
              משתמשים עם role מנהל ו־ business_profile_id זה
            </CardDescription>
          </CardHeader>
          <CardContent>
            {managersError ? (
              <p className="text-sm text-destructive">{managersError.message}</p>
            ) : managers.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין מנהלים משויכים</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {managers.map((m) => (
                  <li key={m.id}>
                    <span className="font-medium">{m.full_name}</span>
                    {m.phone ? (
                      <span className="text-muted-foreground">
                        {" "}
                        — {m.phone}
                      </span>
                    ) : null}
                    {m.is_active === false ? (
                      <span className="mr-2 text-amber-700"> (לא פעיל)</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {showNewTenantHint ? (
        <Card className="border-primary/25 bg-primary/[0.06] shadow-none">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-base text-foreground">
              העסק נוצר בהצלחה
            </CardTitle>
            <CardDescription className="text-foreground/80">
              כעת הוסיפו בניין אחד או יותר — כל בניין משויך אוטומטית ללקוח{" "}
              <span className="font-medium">{tenantRow.name}</span>.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <SuperAdminAddBuildingForm
        tenantId={params.id}
        collapsible
        defaultExpanded={showNewTenantHint}
      />

      {buildingsError ? (
        <Card>
          <CardHeader>
            <CardTitle>שגיאת טעינה</CardTitle>
            <CardDescription>{buildingsError.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : !buildings?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>אין בניינים</CardTitle>
            <CardDescription>לא נמצאו בניינים לחברה זו.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          {unitsListRes.error ? (
            <p className="mb-2 text-sm text-destructive">
              לא ניתן לטעון דירות: {unitsListRes.error.message}
            </p>
          ) : null}
          <div className="overflow-x-auto rounded-lg border [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">כתובת</th>
                  <th className="px-3 py-2 text-start font-medium">עיר</th>
                  <th className="px-3 py-2 text-start font-medium">קומות</th>
                  <th className="px-3 py-2 text-start font-medium">ועד בית</th>
                  <th className="px-3 py-2 text-start font-medium">דירות</th>
                  <th className="px-3 py-2 text-start font-medium">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {(buildings as BuildingRow[]).map((b) => {
                  const unitNums = unitsByBuildingId.get(b.id) ?? [];
                  const buildingHref = `/super-admin/tenants/${params.id}/buildings/${b.id}`;
                  return (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">
                        <Link
                          href={buildingHref}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {b.address}
                        </Link>
                      </td>
                      <td className="px-3 py-2">{b.city}</td>
                      <td className="px-3 py-2 tabular-nums">{b.floors_count}</td>
                      <td className="px-3 py-2 tabular-nums whitespace-nowrap">
                        {formatILS(b.committee_fee)}
                      </td>
                      <td className="max-w-[min(100vw-2rem,320px)] px-3 py-2 align-top">
                        {unitNums.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {unitNums.map((num) => (
                              <Link
                                key={`${b.id}-${num}`}
                                href={buildingHref}
                                className="inline-flex rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground underline-offset-2 hover:bg-muted/80 hover:underline"
                              >
                                {num}
                              </Link>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {b.is_active ? "פעיל" : "לא פעיל"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
