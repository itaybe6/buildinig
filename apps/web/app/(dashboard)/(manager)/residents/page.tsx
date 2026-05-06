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
import Link from "next/link";

type ResidentRow = {
  id: string;
  full_name: string;
  phone: string | null;
  is_active: boolean | null;
  building_id: string | null;
  unit_id: string | null;
};

export default async function ManagerResidentsPage() {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();

  const [buildingsRes, residentsRes, unitsRes] = await Promise.all([
    supabase
      .from("buildings")
      .select("id, address, city")
      .eq("business_profile_id", ctx.businessProfileId)
      .order("address"),
    supabase
      .from("profiles")
      .select(
        "id, full_name, phone, is_active, building_id, unit_id"
      )
      .eq("business_profile_id", ctx.businessProfileId)
      .eq("role", "resident")
      .order("full_name"),
    supabase
      .from("units")
      .select("id, unit_number, floor_number, building_id")
      .eq("business_profile_id", ctx.businessProfileId),
  ]);

  const buildingsError = buildingsRes.error;
  const residentsError = residentsRes.error;
  const unitsError = unitsRes.error;

  const error =
    buildingsError ?? residentsError ?? unitsError ?? null;

  const buildings = buildingsRes.data ?? [];
  const residents = (residentsRes.data ?? []) as ResidentRow[];
  const units = unitsRes.data ?? [];

  const unitById = new Map(
    units.map((u) => [u.id, u] as const)
  );

  const displayPhone = (r: ResidentRow) =>
    r.phone?.trim() || "—";

  const byBuilding = new Map<string, ResidentRow[]>();
  const unassigned: ResidentRow[] = [];
  for (const r of residents) {
    if (!r.building_id) {
      unassigned.push(r);
      continue;
    }
    const list = byBuilding.get(r.building_id) ?? [];
    list.push(r);
    byBuilding.set(r.building_id, list);
  }

  const buildingById = new Map(buildings.map((b) => [b.id, b] as const));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">דיירים</h1>
        <p className="text-sm text-muted-foreground">
          כל הדיירים בארגון, מחולקים לפי בניין. בכל שורה מופיעה הדירה המשויכת
          (אם הוגדרה).
        </p>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>שגיאת טעינה</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : !residents.length ? (
        <Card>
          <CardHeader>
            <CardTitle>אין דיירים</CardTitle>
            <CardDescription>
              לא נמצאו משתמשים עם תפקיד דייר בארגון.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-8">
          {unassigned.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg font-medium">
                ללא שיוך בניין
              </h2>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">שם</th>
                      <th className="px-3 py-2 text-start font-medium">טלפון</th>
                      <th className="px-3 py-2 text-start font-medium">דירה</th>
                      <th className="px-3 py-2 text-start font-medium">קומה</th>
                      <th className="px-3 py-2 text-start font-medium">פעיל</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unassigned.map((r) => {
                      const u = r.unit_id
                        ? unitById.get(r.unit_id)
                        : undefined;
                      return (
                        <tr key={r.id} className="border-b last:border-0">
                          <td className="px-3 py-2 font-medium">
                            {r.full_name}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {displayPhone(r)}
                          </td>
                          <td className="px-3 py-2 tabular-nums">
                            {u?.unit_number ?? "—"}
                          </td>
                          <td className="px-3 py-2 tabular-nums">
                            {u?.floor_number ?? "—"}
                          </td>
                          <td className="px-3 py-2">
                            {r.is_active === false ? "לא" : "כן"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {buildings.map((b) => {
            const list = byBuilding.get(b.id);
            if (!list?.length) return null;
            return (
              <section key={b.id}>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-medium">{b.address}</h2>
                  <p className="text-sm text-muted-foreground">{b.city}</p>
                </div>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-start font-medium">שם</th>
                        <th className="px-3 py-2 text-start font-medium">
                          טלפון
                        </th>
                        <th className="px-3 py-2 text-start font-medium">דירה</th>
                        <th className="px-3 py-2 text-start font-medium">קומה</th>
                        <th className="px-3 py-2 text-start font-medium">פעיל</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r) => {
                        const u = r.unit_id
                          ? unitById.get(r.unit_id)
                          : undefined;
                        return (
                          <tr key={r.id} className="border-b last:border-0">
                            <td className="px-3 py-2 font-medium">
                              {r.full_name}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {displayPhone(r)}
                            </td>
                            <td className="px-3 py-2 tabular-nums">
                              {u?.unit_number ?? "—"}
                            </td>
                            <td className="px-3 py-2 tabular-nums">
                              {u?.floor_number ?? "—"}
                            </td>
                            <td className="px-3 py-2">
                              {r.is_active === false ? "לא" : "כן"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-end text-sm">
                  <Link
                    href={`/buildings/${b.id}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    לפרטי הבניין
                  </Link>
                </p>
              </section>
            );
          })}

          {Array.from(byBuilding.keys())
            .filter((id) => !buildingById.has(id))
            .map((orphanBuildingId) => {
              const list = byBuilding.get(orphanBuildingId)!;
              return (
                <section key={orphanBuildingId}>
                  <h2 className="mb-3 text-lg font-medium">
                    בניין ({orphanBuildingId.slice(0, 8)}…)
                  </h2>
                  <Card>
                    <CardContent className="py-4 text-sm text-muted-foreground">
                      דיירים משויכים לבניין שלא נמצא ברשימת הבניינים של הארגון.
                      ייתכן שהבניין הוסר או שהשיוך לא עודכן.
                    </CardContent>
                  </Card>
                  <div className="mt-3 overflow-x-auto rounded-lg border">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-start font-medium">שם</th>
                          <th className="px-3 py-2 text-start font-medium">
                            טלפון
                          </th>
                          <th className="px-3 py-2 text-start font-medium">דירה</th>
                          <th className="px-3 py-2 text-start font-medium">קומה</th>
                          <th className="px-3 py-2 text-start font-medium">פעיל</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((r) => {
                          const u = r.unit_id
                            ? unitById.get(r.unit_id)
                            : undefined;
                          return (
                            <tr key={r.id} className="border-b last:border-0">
                              <td className="px-3 py-2 font-medium">
                                {r.full_name}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {displayPhone(r)}
                              </td>
                              <td className="px-3 py-2 tabular-nums">
                                {u?.unit_number ?? "—"}
                              </td>
                              <td className="px-3 py-2 tabular-nums">
                                {u?.floor_number ?? "—"}
                              </td>
                              <td className="px-3 py-2">
                                {r.is_active === false ? "לא" : "כן"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
        </div>
      )}
    </div>
  );
}
