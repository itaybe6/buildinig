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
    .select("id, unit_number, monthly_fee, type")
    .eq("building_id", params.id)
    .eq("business_profile_id", ctx.businessProfileId)
    .order("unit_number");

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

      <div className="grid gap-4 md:grid-cols-2">
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
            <CardTitle className="text-base">דירות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {units?.length ?? 0}
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

      <div>
        <h2 className="mb-3 text-lg font-medium">דירות</h2>
        {!units?.length ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              אין דירות רשומות לבניין זה.
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">מספר דירה</th>
                  <th className="px-3 py-2 text-start font-medium">סוג</th>
                  <th className="px-3 py-2 text-start font-medium">ועד חודשי</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{u.unit_number}</td>
                    <td className="px-3 py-2">{u.type ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums">{u.monthly_fee ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
