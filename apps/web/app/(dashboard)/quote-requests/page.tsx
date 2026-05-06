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
import { QUOTE_STATUS_LABEL } from "@my-project/shared";
import Link from "next/link";

export default async function QuoteRequestsPage() {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) return <NoTenantNotice />;

  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from("quote_requests")
    .select(
      `
      id,
      title,
      status,
      created_at,
      preferred_date,
      buildings ( name ),
      units ( unit_number ),
      service_types ( name )
    `
    )
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">בקשות הצעת מחיר</h1>
        <p className="text-sm text-muted-foreground">טבלת quote_requests.</p>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>שגיאת טעינה</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : !rows?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>אין בקשות</CardTitle>
            <CardDescription>לא נמצאו בקשות הצעת מחיר.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-start font-medium">נושא</th>
                <th className="px-3 py-2 text-start font-medium">בניין</th>
                <th className="px-3 py-2 text-start font-medium">דירה</th>
                <th className="px-3 py-2 text-start font-medium">סוג שירות</th>
                <th className="px-3 py-2 text-start font-medium">סטטוס</th>
                <th className="px-3 py-2 text-start font-medium">תאריך מועדף</th>
                <th className="px-3 py-2 text-start font-medium">נוצר</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const b = row.buildings as unknown as { name: string } | null;
                const u = row.units as unknown as { unit_number: string } | null;
                const st = row.service_types as unknown as {
                  name: string;
                } | null;
                return (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <Link
                        href={`/quote-requests/${row.id}`}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {row.title}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{b?.name ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums">{u?.unit_number ?? "—"}</td>
                    <td className="px-3 py-2">{st?.name ?? "—"}</td>
                    <td className="px-3 py-2">{QUOTE_STATUS_LABEL[row.status]}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.preferred_date
                        ? new Date(row.preferred_date).toLocaleDateString("he-IL")
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleString("he-IL")
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
