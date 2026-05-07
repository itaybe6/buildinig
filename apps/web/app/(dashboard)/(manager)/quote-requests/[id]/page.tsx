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
import { formatILS, QUOTE_STATUS_LABEL } from "@my-project/shared";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function QuoteRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const { data: qr, error } = await supabase
    .from("quote_requests")
    .select(
      `
      *,
      buildings ( address, city ),
      units ( unit_number ),
      requester:profiles!quote_requests_requested_by_fkey ( full_name, phone ),
      service_types ( name, description )
    `
    )
    .eq("id", params.id)
    .eq("business_profile_id", ctx.businessProfileId)
    .maybeSingle();

  if (error) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>שגיאה</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!qr) notFound();

  const { data: quotes } = await supabase
    .from("quotes")
    .select(
      `
      id,
      amount,
      description,
      valid_until,
      notes,
      created_at,
      creator:profiles!quotes_created_by_fkey ( full_name )
    `
    )
    .eq("request_id", params.id)
    .eq("business_profile_id", ctx.businessProfileId)
    .order("created_at", { ascending: false });

  const building = qr.buildings as unknown as {
    address: string;
    city: string;
  } | null;
  const unit = qr.units as unknown as { unit_number: string } | null;
  const requester = qr.requester as unknown as {
    full_name: string;
    phone: string | null;
  } | null;
  const st = qr.service_types as unknown as {
    name: string;
    description: string | null;
  } | null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{qr.title}</h1>
          <p className="text-sm text-muted-foreground">
            {QUOTE_STATUS_LABEL[qr.status]}
            {qr.preferred_date
              ? ` · תאריך מועדף: ${new Date(qr.preferred_date).toLocaleDateString("he-IL")}`
              : ""}
          </p>
        </div>
        <Link
          href="/quote-requests"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          חזרה לרשימה
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">מיקום ובקשה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              {building ? `${building.address}, ${building.city}` : "—"}
            </p>
            <p>דירה: {unit?.unit_number ?? "—"}</p>
            <p>
              מבקש: {requester?.full_name ?? "—"}{" "}
              {requester?.phone ? `(${requester.phone})` : ""}
            </p>
            <p>סוג שירות: {st?.name ?? "—"}</p>
            {qr.resident_proposed_amount != null &&
            String(qr.resident_proposed_amount).trim() !== "" ? (
              <p className="font-medium">
                מחיר מוצע על ידי הדייר:{" "}
                {formatILS(qr.resident_proposed_amount)}
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">תיאור</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">
              {qr.description ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">הצעות מחיר (quotes)</h2>
        {!quotes?.length ? (
          <p className="text-sm text-muted-foreground">אין הצעות מחיר קשורות.</p>
        ) : (
          <div className="space-y-3">
            {quotes.map((q) => {
              const cr = q.creator as unknown as { full_name: string } | null;
              return (
                <Card key={q.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base tabular-nums">
                      {q.amount} ₪
                    </CardTitle>
                    <CardDescription>
                      {cr?.full_name ?? "—"} ·{" "}
                      {q.created_at
                        ? new Date(q.created_at).toLocaleString("he-IL")
                        : ""}
                      {q.valid_until
                        ? ` · בתוקף עד ${new Date(q.valid_until).toLocaleDateString("he-IL")}`
                        : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="whitespace-pre-wrap">{q.description}</p>
                    {q.notes ? (
                      <p className="text-muted-foreground">הערות: {q.notes}</p>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
