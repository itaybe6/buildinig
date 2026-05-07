import { ResidentServicesCatalog } from "@/components/resident/resident-services-catalog";
import { NoTenantNotice } from "@/components/no-tenant-notice";
import { getResidentTenantContext } from "@/lib/dashboard/session";
import { getResidentBuildingOptions } from "@/lib/resident/building-options";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import { QUOTE_STATUS_LABEL } from "@my-project/shared";
import Link from "next/link";

export default async function ResidentQuotesPage() {
  const ctx = await getResidentTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const profileId = ctx.profile.profileId;
  const { businessProfileId } = ctx;

  const [buildings, servicesRes, quotesRes] = await Promise.all([
    getResidentBuildingOptions(supabase, {
      profileId,
      businessProfileId,
    }),
    supabase
      .from("service_types")
      .select("id, name, description, price_min, price_max")
      .eq("business_profile_id", businessProfileId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("quote_requests")
      .select("id, title, status, created_at")
      .eq("business_profile_id", businessProfileId)
      .eq("requested_by", profileId)
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  const services = servicesRes.data ?? [];
  const rows = quotesRes.data ?? [];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">שירותים</h1>
        <p className="text-sm text-muted-foreground">
          שירותים שהעסק מציע; ניתן להגיש הצעת מחיר לכל שירות.
        </p>
      </div>

      {servicesRes.error ? (
        <Card>
          <CardHeader>
            <CardTitle>שגיאת טעינת שירותים</CardTitle>
            <CardDescription>{servicesRes.error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ResidentServicesCatalog
          services={services}
          buildings={buildings}
          businessProfileId={businessProfileId}
        />
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">הבקשות שלי</h2>
          <p className="text-sm text-muted-foreground">
            בקשות הצעת מחיר שכבר שלחת וסטטוסן.
          </p>
        </div>

        {quotesRes.error ? (
          <Card>
            <CardHeader>
              <CardTitle>שגיאת טעינה</CardTitle>
              <CardDescription>{quotesRes.error.message}</CardDescription>
            </CardHeader>
          </Card>
        ) : !rows.length ? (
          <Card>
            <CardHeader>
              <CardTitle>אין בקשות</CardTitle>
              <CardDescription>
                עדיין לא הגשת בקשות — בחר שירות מהטבלה למעלה.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">נושא</th>
                  <th className="px-3 py-2 text-start font-medium">סטטוס</th>
                  <th className="px-3 py-2 text-start font-medium">נוצר</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <Link
                        href={`/quotes/${row.id}`}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {row.title}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      {QUOTE_STATUS_LABEL[
                        row.status as keyof typeof QUOTE_STATUS_LABEL
                      ] ?? row.status}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleString("he-IL")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
