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
import {
  PAYMENT_STATUS_LABEL,
  PAYMENT_TYPE_LABEL,
} from "@my-project/shared";

export default async function PaymentsPage() {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) return <NoTenantNotice />;

  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from("payments")
    .select(
      `
      id,
      amount,
      currency,
      status,
      type,
      due_date,
      paid_at,
      description,
      buildings ( name ),
      units ( unit_number ),
      resident:profiles!payments_resident_id_fkey ( full_name )
    `
    )
    .eq("tenant_id", ctx.tenantId)
    .order("due_date", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">תשלומים</h1>
        <p className="text-sm text-muted-foreground">טבלת payments.</p>
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
            <CardTitle>אין תשלומים</CardTitle>
            <CardDescription>לא נמצאו רשומות.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-start font-medium">דייר</th>
                <th className="px-3 py-2 text-start font-medium">בניין</th>
                <th className="px-3 py-2 text-start font-medium">דירה</th>
                <th className="px-3 py-2 text-start font-medium">סכום</th>
                <th className="px-3 py-2 text-start font-medium">סוג</th>
                <th className="px-3 py-2 text-start font-medium">סטטוס</th>
                <th className="px-3 py-2 text-start font-medium">יעד</th>
                <th className="px-3 py-2 text-start font-medium">שולם</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const b = row.buildings as unknown as { name: string } | null;
                const u = row.units as unknown as { unit_number: string } | null;
                const res = row.resident as unknown as {
                  full_name: string;
                } | null;
                return (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">
                      {res?.full_name ?? "—"}
                    </td>
                    <td className="px-3 py-2">{b?.name ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {u?.unit_number ?? "—"}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {row.amount} {row.currency ?? "ILS"}
                    </td>
                    <td className="px-3 py-2">{PAYMENT_TYPE_LABEL[row.type]}</td>
                    <td className="px-3 py-2">
                      {PAYMENT_STATUS_LABEL[row.status]}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(row.due_date).toLocaleDateString("he-IL")}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.paid_at
                        ? new Date(row.paid_at).toLocaleDateString("he-IL")
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
