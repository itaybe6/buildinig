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
import Link from "next/link";
import { notFound } from "next/navigation";

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "full_name"
  | "phone"
  | "mobile_phone"
  | "role"
  | "is_active"
  | "created_at"
  | "unit_id"
>;

type PageProps = {
  params:
    | Promise<{ id: string; buildingId: string }>
    | { id: string; buildingId: string };
};

type UnitRow = Pick<
  Database["public"]["Tables"]["units"]["Row"],
  "id" | "unit_number" | "floor_number" | "type" | "monthly_fee" | "size_sqm"
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
            {p.mobile_phone ? ` · ${p.mobile_phone}` : ""}
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
    .select("id, tenant_id, address, city, floors_count, is_active, created_at")
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

  if (!building || building.tenant_id !== params.id) {
    notFound();
  }

  const { data: tenant } = await supabase
    .from("business_profiles")
    .select("name")
    .eq("id", params.id)
    .maybeSingle();

  const tenantName =
    (tenant as { name: string | null } | null)?.name ?? null;

  const { data: profiles, error: pe } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone, mobile_phone, role, is_active, created_at, unit_id"
    )
    .eq("building_id", params.buildingId)
    .order("full_name");

  const profileRows = (profiles ?? []) as ProfileRow[];

  const profilesByUnitId = new Map<string, ProfileRow[]>();
  for (const p of profileRows) {
    if (!p.unit_id) continue;
    const bucket = profilesByUnitId.get(p.unit_id) ?? [];
    bucket.push(p);
    profilesByUnitId.set(p.unit_id, bucket);
  }
  profilesByUnitId.forEach((arr) => {
    arr.sort(sortProfilesByName);
  });

  const profilesWithoutUnit = profileRows
    .filter((p) => !p.unit_id)
    .sort(sortProfilesByName);

  const { data: unitsRaw, error: ue } = await supabase
    .from("units")
    .select("id, unit_number, floor_number, type, monthly_fee, size_sqm")
    .eq("building_id", params.buildingId);

  const units = (unitsRaw ?? []) as UnitRow[];
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
            {building.city} · {profileRows.length} פרופילים עם{" "}
            <span className="font-mono text-xs">building_id</span> זה
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
            <span className="text-muted-foreground">נוצר: </span>
            {building.created_at
              ? new Date(building.created_at).toLocaleString("he-IL")
              : "—"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">דירות לפי קומה</CardTitle>
          <CardDescription>
            לפי מספר הקומות בבניין ({floorsCount}), שדה קומה בדירות (
            <span className="font-mono text-xs">units.floor_number</span>)
            ומשתמשים משויכים לדירה (
            <span className="font-mono text-xs">profiles.unit_id</span>)
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
                                  {u.size_sqm != null ? (
                                    <span className="text-muted-foreground">
                                      {" "}
                                      · {u.size_sqm} מ״ר
                                    </span>
                                  ) : null}
                                  {u.monthly_fee != null ? (
                                    <span className="text-muted-foreground">
                                      {" "}
                                      · ועד {u.monthly_fee}
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
          <CardTitle className="text-lg">
            משתמשים בשכונה ללא דירה משויכת
          </CardTitle>
          <CardDescription>
            פרופילים עם <span className="font-mono text-xs">building_id</span>{" "}
            לבניין זה וללא{" "}
            <span className="font-mono text-xs">unit_id</span> (למשל לא צוין
            בעת ההזמנה). יתר המשתמשים מופיעים תחת כל דירה בטבלה למעלה.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pe ? (
            <p className="text-sm text-destructive">{pe.message}</p>
          ) : !profileRows.length ? (
            <p className="text-sm text-muted-foreground">
              אין פרופילים משויכים לבניין זה.
            </p>
          ) : profilesWithoutUnit.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              אין — כל המשתמשים משויכים לדירה או שאין משתמשים כלל.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">שם</th>
                    <th className="px-3 py-2 text-start font-medium">טלפון</th>
                    <th className="px-3 py-2 text-start font-medium">פלאפון</th>
                    <th className="px-3 py-2 text-start font-medium">תפקיד</th>
                    <th className="px-3 py-2 text-start font-medium">פעיל</th>
                  </tr>
                </thead>
                <tbody>
                  {profilesWithoutUnit.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">{p.full_name}</td>
                      <td className="px-3 py-2">{p.phone ?? "—"}</td>
                      <td className="px-3 py-2">{p.mobile_phone ?? "—"}</td>
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
        </CardContent>
      </Card>
    </div>
  );
}
