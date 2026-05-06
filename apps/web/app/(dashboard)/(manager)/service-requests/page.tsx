import { NoTenantNotice } from "@/components/no-tenant-notice";
import { getManagerTenantContext } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import {
  REQUEST_CATEGORY_LABEL,
  REQUEST_PRIORITY_LABEL,
  REQUEST_STATUS_LABEL,
} from "@my-project/shared";
import Link from "next/link";

export default async function ServiceRequestsBoardPage() {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from("service_requests")
    .select(
      `
      id,
      title,
      status,
      priority,
      category,
      created_at,
      buildings ( name ),
      units ( unit_number ),
      reporter:profiles!service_requests_reported_by_fkey ( full_name )
    `
    )
    .eq("business_profile_id", ctx.businessProfileId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">קריאות שירות</h1>
        <p className="text-sm text-muted-foreground">
          כל הקריאות בארגון, עם בניין ודיווח.
        </p>
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
            <CardTitle>אין קריאות</CardTitle>
            <CardDescription>לא נמצאו רשומות ב-service_requests.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-start font-medium">נושא</th>
                <th className="px-3 py-2 text-start font-medium">בניין</th>
                <th className="px-3 py-2 text-start font-medium">דירה</th>
                <th className="px-3 py-2 text-start font-medium">מדווח</th>
                <th className="px-3 py-2 text-start font-medium">קטגוריה</th>
                <th className="px-3 py-2 text-start font-medium">עדיפות</th>
                <th className="px-3 py-2 text-start font-medium">סטטוס</th>
                <th className="px-3 py-2 text-start font-medium">נוצר</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const building = row.buildings as unknown as {
                  name: string;
                } | null;
                const unit = row.units as unknown as {
                  unit_number: string;
                } | null;
                const reporter = row.reporter as unknown as {
                  full_name: string;
                } | null;
                return (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <Link
                        href={`/service-requests/${row.id}`}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {row.title}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{building?.name ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {unit?.unit_number ?? "—"}
                    </td>
                    <td className="px-3 py-2">{reporter?.full_name ?? "—"}</td>
                    <td className="px-3 py-2">
                      {REQUEST_CATEGORY_LABEL[row.category]}
                    </td>
                    <td className="px-3 py-2">
                      {REQUEST_PRIORITY_LABEL[row.priority]}
                    </td>
                    <td className="px-3 py-2">
                      {REQUEST_STATUS_LABEL[row.status]}
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
