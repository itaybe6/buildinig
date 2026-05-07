import { NoTenantNotice } from "@/components/no-tenant-notice";
import { getEmployeeTenantContext } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
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
import { notFound } from "next/navigation";

export default async function EmployeeAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getEmployeeTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const { data: row, error } = await supabase
    .from("service_requests")
    .select(
      "title, description, category, status, priority, internal_notes, created_at, assigned_to, buildings!inner(business_profile_id)"
    )
    .eq("id", id)
    .eq("buildings.business_profile_id", ctx.businessProfileId)
    .maybeSingle();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>שגיאה</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!row || row.assigned_to !== ctx.profile.profileId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/assignments"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← חזרה למשימות
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {row.title}
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>פרטי קריאה</CardTitle>
          <CardDescription>
            נוצר{" "}
            {row.created_at
              ? new Date(row.created_at).toLocaleString("he-IL")
              : "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="font-medium">סטטוס: </span>
            {REQUEST_STATUS_LABEL[
              row.status as keyof typeof REQUEST_STATUS_LABEL
            ] ?? row.status}
          </p>
          <p>
            <span className="font-medium">קטגוריה: </span>
            {REQUEST_CATEGORY_LABEL[
              row.category as keyof typeof REQUEST_CATEGORY_LABEL
            ] ?? row.category}
          </p>
          <p>
            <span className="font-medium">עדיפות: </span>
            {REQUEST_PRIORITY_LABEL[
              row.priority as keyof typeof REQUEST_PRIORITY_LABEL
            ] ?? row.priority}
          </p>
          {row.description ? (
            <div>
              <p className="font-medium">תיאור</p>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {row.description}
              </p>
            </div>
          ) : null}
          {row.internal_notes ? (
            <div>
              <p className="font-medium">הערות פנימיות</p>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {row.internal_notes}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
