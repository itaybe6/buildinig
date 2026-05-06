import { AddBusinessForm } from "@/components/super-admin/add-business-form";
import { requireSuperAdmin } from "@/lib/dashboard/session";
import Link from "next/link";

export default async function SuperAdminNewTenantPage() {
  await requireSuperAdmin();

  return (
    <div className="relative min-h-[calc(100vh-6rem)]">
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -start-[20%] top-0 h-[420px] w-[420px] rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute -end-[10%] bottom-0 h-[360px] w-[360px] rounded-full bg-muted-foreground/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-muted/40" />
      </div>

      <div className="mx-auto max-w-xl px-4 pb-12 pt-2 sm:px-6 sm:pt-4">
        <Link
          href="/super-admin/tenants"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/90 hover:underline"
        >
          חזרה לרשימת הלקוחות
        </Link>

        <header className="mt-8 space-y-3 text-start">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            סופר־אדמין
          </p>
          <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            הוספת לקוח חדש
          </h1>
          <p className="max-w-prose text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            נוצרת רשומת{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              tenants
            </code>{" "}
            ופרופיל עסק. לאחר מכן יש לשייך מנהל לעסק דרך{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              profiles.tenant_id
            </code>{" "}
            או דרך זרימת ההזמנה שלכם.
          </p>
        </header>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_22px_48px_-16px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.03] dark:ring-white/[0.06]">
          <AddBusinessForm
            embedded
            showHeader={false}
            redirectTo="/super-admin/tenants"
          />
        </div>
      </div>
    </div>
  );
}
