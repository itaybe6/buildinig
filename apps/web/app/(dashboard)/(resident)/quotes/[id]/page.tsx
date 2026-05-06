import { NoTenantNotice } from "@/components/no-tenant-notice";
import { getResidentTenantContext } from "@/lib/dashboard/session";
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
import { notFound } from "next/navigation";

export default async function ResidentQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getResidentTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const { data: row, error } = await supabase
    .from("quote_requests")
    .select(
      "title, description, status, preferred_date, created_at, requested_by"
    )
    .eq("id", id)
    .eq("business_profile_id", ctx.businessProfileId)
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

  if (!row || row.requested_by !== ctx.profile.profileId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/quotes"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← חזרה להצעות
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {row.title}
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>פרטים</CardTitle>
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
            {QUOTE_STATUS_LABEL[
              row.status as keyof typeof QUOTE_STATUS_LABEL
            ] ?? row.status}
          </p>
          {row.preferred_date ? (
            <p>
              <span className="font-medium">תאריך מועדף: </span>
              {new Date(row.preferred_date).toLocaleDateString("he-IL")}
            </p>
          ) : null}
          {row.description ? (
            <p className="whitespace-pre-wrap text-muted-foreground">
              {row.description}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
