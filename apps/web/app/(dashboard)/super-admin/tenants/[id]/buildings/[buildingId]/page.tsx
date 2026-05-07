import { SuperAdminAddBuildingUnitsPanel } from "@/components/super-admin/super-admin-add-building-units-panel";
import { requireSuperAdmin } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import type { Database } from "@my-project/supabase";
import { formatILS } from "@my-project/shared";
import Link from "next/link";
import { notFound } from "next/navigation";

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "full_name"
  | "phone"
  | "role"
  | "is_active"
  | "created_at"
>;

type PageProps = {
  params:
    | Promise<{ id: string; buildingId: string }>
    | { id: string; buildingId: string };
};

type UnitRow = Pick<
  Database["public"]["Tables"]["units"]["Row"],
  "id" | "unit_number" | "floor_number" | "type"
>;

function compareUnitNumber(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function sortProfilesByName(a: ProfileRow, b: ProfileRow) {
  return a.full_name.localeCompare(b.full_name, "he");
}

function ProfileLines({ profiles: list }: { profiles: ProfileRow[] }) {
  if (list.length === 0) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        אין משתמשים משויכים לדירה זו
      </p>
    );
  }
  return (
    <ul className="mt-2 space-y-1.5 border-t border-border/50 pt-2 text-xs">
      {list.map((p) => (
        <li key={p.id} className="text-foreground">
          <span className="font-medium">{p.full_name}</span>
          <span className="text-muted-foreground">
            {" "}
            · {p.role}
            {p.is_active === false ? " · לא פעיל" : ""}
            {p.phone ? ` · ${p.phone}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function SuperAdminBuildingProfilesPage(props: PageProps) {
  const params = await Promise.resolve(props.params);
  await requireSuperAdmin();
  const supabase = createClient();

  const { data: building, error: be } = await supabase
    .from("buildings")
    .select(
      "id, business_profile_id, address, city, floors_count, committee_fee, is_active, created_at"
    )
    .eq("id", params.buildingId)
    .maybeSingle();

  if (be) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>שגיאה</CardTitle>
          <CardDescription>{be.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!building || building.business_profile_id !== params.id) {
    notFound();
  }

  const { data: tenant } = await supabase
    .from("business_profiles")
    .select("name")
    .eq("id", params.id)
    .maybeSingle();

  const tenantName =
    (tenant as { name: string | null } | null)?.name ?? null;

  const { data: unitsRaw, error: ue } = await supabase
    .from("units")
    .select(
      "id, unit_number, floor_number, type, resident_profile_id"
    )
    .eq("building_id", params.buildingId);

  const units = (unitsRaw ?? []) as (UnitRow & {
    resident_profile_id: string | null;
  })[];

  const residentIds = Array.from(
    new Set(
      units
        .map((u) => u.resident_profile_id)
        .filter((x): x is string => Boolean(x))
    )
  );

  const { data: resProfiles, error: pe } =
    residentIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, phone, role, is_active, created_at")
          .in("id", residentIds)
          .order("full_name")
      : { data: [] as ProfileRow[], error: null };

  const profileRows = (resProfiles ?? []) as ProfileRow[];

  const profilesByUnitId = new Map<string, ProfileRow[]>();
  for (const u of units) {
    if (!u.resident_profile_id) continue;
    const p = profileRows.find((x) => x.id === u.resident_profile_id);
    if (!p) continue;
    const bucket = profilesByUnitId.get(u.id) ?? [];
    bucket.push(p);
    profilesByUnitId.set(u.id, bucket);
  }
  profilesByUnitId.forEach((arr) => {
    arr.sort(sortProfilesByName);
  });

  const floorsCount = Math.max(1, building.floors_count);

  const unitsByFloor = Array.from({ length: floorsCount }, (_, i) => {
    const floor = i + 1;
    return {
      floor,
      units: units
        .filter((u) => u.floor_number === floor)
        .sort((a, b) => compareUnitNumber(a.unit_number, b.unit_number)),
    };
  });

  const orphanUnits = units.filter(
    (u) =>
      u.floor_number == null ||
      u.floor_number < 1 ||
      u.floor_number > floorsCount
  );
  orphanUnits.sort((a, b) => compareUnitNumber(a.unit_number, b.unit_number));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            בניין — {building.address}
          </h1>
          <p className="text-sm text-muted-foreground">
            {building.city} · {profileRows.length} דיירים משויכים לדירות בבניין
          </p>
        </div>
        <Link
          href={`/super-admin/tenants/${params.id}`}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          חזרה לעסק {tenantName ? `— ${tenantName}` : ""}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">פרטי בניין</CardTitle>
          <CardDescription>
            עסק: {tenantName ?? "—"} · קומות {building.floors_count} ·{" "}
            {building.is_active ? "פעיל" : "לא פעיל"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">כתובת: </span>
            {building.address}
          </p>
          <p>
            <span className="text-muted-foreground">עיר: </span>
            {building.city}
          </p>
          <p>
            <span className="text-muted-foreground">דמי ועד בית (חודשי לדירה): </span>
            {formatILS(building.committee_fee)}
          </p>
          <p>
            <span className="text-muted-foreground">נוצר: </span>
            {building.created_at
              ? new Date(building.created_at).toLocaleString("he-IL")
              : "—"}
          </p>
        </CardContent>
      </Card>

      <SuperAdminAddBuildingUnitsPanel
        tenantId={params.id}
        buildingId={params.buildingId}
        existingUnitNumbers={units.map((u) => u.unit_number)}
        suggestedFloorCount={building.floors_count}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">דירות לפי קומה</CardTitle>
          <CardDescription>
            לפי מספר הקומות בבניין ({floorsCount}), שדה קומה בדירות (
            <span className="font-mono text-xs">units.floor_number</span>)
            ודייר משויך מוצג לפי{" "}
            <span className="font-mono text-xs">units.resident_profile_id</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ue ? (
            <p className="text-sm text-destructive">{ue.message}</p>
          ) : (
            <div className="space-y-6">
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="w-28 px-3 py-2 text-start font-medium">
                        קומה
                      </th>
                      <th className="px-3 py-2 text-start font-medium">דירות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unitsByFloor.map(({ floor, units: floorUnits }) => (
                      <tr key={floor} className="border-b align-top last:border-0">
                        <td className="px-3 py-3 font-medium tabular-nums">
                          {floor}
                        </td>
                        <td className="px-3 py-3">
                          {floorUnits.length === 0 ? (
                            <span className="text-muted-foreground">
                              אין דירות משויכות לקומה זו
                            </span>
                          ) : (
                            <ul className="flex flex-col gap-2">
                              {floorUnits.map((u) => (
                                <li
                                  key={u.id}
                                  className="rounded-md border border-border/60 bg-muted/20 px-3 py-2"
                                >
                                  <span className="font-medium">
                                    דירה {u.unit_number}
                                  </span>
                                  {u.type ? (
                                    <span className="text-muted-foreground">
                                      {" "}
                                      · {u.type}
                                    </span>
                                  ) : null}
                                  <ProfileLines
                                    profiles={
                                      profilesByUnitId.get(u.id) ?? []
                                    }
                                  />
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {orphanUnits.length > 0 ? (
                <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <p className="mb-2 text-sm font-medium">
                    דירות ללא קומה או עם קומה מחוץ לטווח 1–{floorsCount}
                  </p>
                  <ul className="flex flex-col gap-2 text-sm">
                    {orphanUnits.map((u) => (
                      <li key={u.id} className="rounded-md border bg-background px-3 py-2">
                        <span className="font-medium">דירה {u.unit_number}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · קומה בטבלה:{" "}
                          {u.floor_number == null ? "לא צוין" : u.floor_number}
                        </span>
                        {u.type ? (
                          <span className="text-muted-foreground"> · {u.type}</span>
                        ) : null}
                        <ProfileLines
                          profiles={profilesByUnitId.get(u.id) ?? []}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">שיוך דייר לבניין</CardTitle>
          <CardDescription>
            שיוך דייר לכתובת מתבצע רק דרך דירה — עמודה{" "}
            <span className="font-mono text-xs">resident_profile_id</span> בטבלת
            הדירות. אין עוד רשימת «בניין בלי דירה» ברמת הפרופיל.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pe ? (
            <p className="text-sm text-destructive">{pe.message}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              אין רשימה נפרדת — השתמשו בשיוך דירה בממשק המנהל.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
