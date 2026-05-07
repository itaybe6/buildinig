import { AddBuildingResidentForm } from "@/components/manager/add-building-resident-form";
import { ManagerBuildingUnitsPanel } from "@/components/manager/manager-building-units-panel";
import { NoTenantNotice } from "@/components/no-tenant-notice";
import { getManagerTenantContext } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import { formatILS } from "@my-project/shared";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function BuildingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const { data: building, error: bErr } = await supabase
    .from("buildings")
    .select("*")
    .eq("id", params.id)
    .eq("business_profile_id", ctx.businessProfileId)
    .maybeSingle();

  if (bErr) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>שגיאה</CardTitle>
          <CardDescription>{bErr.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!building) notFound();

  const { data: units } = await supabase
    .from("units")
    .select("id, unit_number, floor_number, type, resident_profile_id")
    .eq("building_id", params.id)
    .order("unit_number");

  const residentIds = Array.from(
    new Set(
      (units ?? [])
        .map((u) => u.resident_profile_id)
        .filter((x): x is string => Boolean(x))
    )
  );

  const { data: residentRows } =
    residentIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", residentIds)
      : { data: [] as { id: string; full_name: string; phone: string | null }[] };

  const profileById = new Map(
    (residentRows ?? []).map((p) => [p.id, p] as const)
  );

  const unitsWithResident = (units ?? []).map((u) => {
    const r = u.resident_profile_id
      ? profileById.get(u.resident_profile_id)
      : undefined;
    return {
      ...u,
      resident: r
        ? { id: r.id, full_name: r.full_name, phone: r.phone }
        : null,
    };
  });

  const { data: orgBuildings } = await supabase
    .from("buildings")
    .select("id")
    .eq("business_profile_id", ctx.businessProfileId);

  const orgBuildingIds = (orgBuildings ?? []).map((b) => b.id);
  const { data: orgUnits } =
    orgBuildingIds.length > 0
      ? await supabase
          .from("units")
          .select("resident_profile_id")
          .in("building_id", orgBuildingIds)
      : { data: [] as { resident_profile_id: string | null }[] };

  const assignedResidentIds = new Set(
    (orgUnits ?? [])
      .map((x) => x.resident_profile_id)
      .filter((x): x is string => Boolean(x))
  );

  const { data: residentPool } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .eq("business_profile_id", ctx.businessProfileId)
    .eq("role", "resident")
    .order("full_name");

  const eligibleProfiles = (residentPool ?? []).filter(
    (p) => !assignedResidentIds.has(p.id)
  );

  const { data: linkedData } =
    residentIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, phone, role, is_active")
          .in("id", residentIds)
          .order("full_name")
      : { data: [] as { id: string; full_name: string; phone: string | null; role: string; is_active: boolean | null }[] };

  const profiles = linkedData ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {building.address}
          </h1>
          <p className="text-sm text-muted-foreground">{building.city}</p>
        </div>
        <Link
          href="/buildings"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          חזרה לרשימת בניינים
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">קומות (שדה)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {building.floors_count}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">דמי ועד בית</CardTitle>
            <CardDescription className="text-xs">חודשי לדירה</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatILS(building.committee_fee)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">דירות רשומות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {unitsWithResident.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {building.manager_notes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">הערות ניהול</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{building.manager_notes}</p>
          </CardContent>
        </Card>
      ) : null}

      <ManagerBuildingUnitsPanel
        key={params.id}
        buildingId={params.id}
        units={unitsWithResident}
        eligibleProfiles={eligibleProfiles}
      />

      <div>
        <h2 className="mb-3 text-lg font-medium">
          משתמשים משויכים לבניין
        </h2>
        {!profiles.length ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              עדיין אין דיירים משויכים לדירות בבניין זה (
              <code className="rounded bg-muted px-1 text-xs">
                units.resident_profile_id
              </code>
              ).
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">שם</th>
                  <th className="px-3 py-2 text-start font-medium">טלפון</th>
                  <th className="px-3 py-2 text-start font-medium">תפקיד</th>
                  <th className="px-3 py-2 text-start font-medium">פעיל</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{p.full_name}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {p.phone ?? "—"}
                    </td>
                    <td className="px-3 py-2">{p.role}</td>
                    <td className="px-3 py-2">
                      {p.is_active === false ? "לא" : "כן"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddBuildingResidentForm buildingId={params.id} />
    </div>
  );
}
