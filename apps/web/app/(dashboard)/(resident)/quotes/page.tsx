import { NoTenantNotice } from "@/components/no-tenant-notice";
import { getResidentTenantContext } from "@/lib/dashboard/session";
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
  const { data: rows, error } = await supabase
    .from("quote_requests")
    .select("id, title, status, created_at")
    .eq("business_profile_id", ctx.businessProfileId)
    .eq("requested_by", ctx.profile.profileId)
    .order("created_at", { ascending: false })
    .limit(80);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">הצעות מחיר</h1>
          <p className="text-sm text-muted-foreground">
            בקשות הצעת מחיר ששלחת.
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="rounded-md border bg-card px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          בקשה חדשה
        </Link>
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
    </div>
  );
}
