import { AddBusinessForm } from "@/components/super-admin/add-business-form";
import { requireSuperAdmin } from "@/lib/dashboard/session";
import Link from "next/link";

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 12h.01M9 15h.01M12 9h.01M12 12h.01M12 15h.01M15 9h.01M15 12h.01M15 15h.01M9 21v-3h6v3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function SuperAdminNewTenantPage() {
  await requireSuperAdmin();

  return (
    <div className="relative isolate min-h-[calc(100vh-6rem)] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.09] via-background to-muted/50" />
        <div className="absolute -start-[15%] -top-32 h-[min(520px,80vw)] w-[min(520px,80vw)] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -end-[20%] top-1/3 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 start-1/2 h-px w-[min(100%,48rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        <div className="absolute inset-0 opacity-[0.38] [background-image:linear-gradient(to_right,hsl(var(--border)/0.45)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.45)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_22%,black_38%,transparent)]" />
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-16 pt-4 sm:px-6 sm:pt-6">
        <Link
          href="/super-admin/tenants"
          className="group inline-flex items-center gap-2.5 rounded-full border border-border/70 bg-card/90 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition hover:border-primary/35 hover:bg-accent/80 hover:shadow-md"
        >
          <span
            className="flex size-7 items-center justify-center rounded-full bg-muted/80 text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary"
            aria-hidden
          >
            <svg
              viewBox="0 0 20 20"
              className="size-4 rotate-180"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          חזרה לרשימת הלקוחות
        </Link>

        <div className="mt-10 flex flex-col gap-6 sm:mt-12 sm:flex-row sm:items-start sm:gap-8">
          <div className="flex shrink-0 justify-center sm:pt-1">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/75 text-primary-foreground shadow-lg shadow-primary/25 ring-4 ring-primary/10 sm:size-16">
              <BuildingIcon className="size-7 sm:size-8" />
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-4 text-start">
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              סופר־אדמין · יצירת לקוח
            </div>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              הוספת לקוח חדש
            </h1>
            <p className="max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              הגדירו את שם העסק והפרטים הבסיסיים. מיד אחרי השמירה תועברו לשלב
              הבא — הוספת בניינים ללקוח החדש (ניתן להוסיף כמה שצריך).
            </p>

            <details className="group mt-2 rounded-xl border border-border/60 bg-muted/25 px-4 py-3 text-start shadow-inner transition-colors open:bg-muted/35">
              <summary className="cursor-pointer select-none text-sm font-medium text-foreground/90 outline-none [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="size-1.5 rounded-full bg-primary/70"
                    aria-hidden
                  />
                  פרטים טכניים (בסיס נתונים)
                </span>
              </summary>
              <p className="mt-3 border-t border-border/50 pt-3 text-xs leading-relaxed text-muted-foreground">
                נוצרות רשומות ב־
                <code className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-[11px] text-foreground/85 ring-1 ring-border/50">
                  tenants
                </code>{" "}
                וב־
                <code className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-[11px] text-foreground/85 ring-1 ring-border/50">
                  business_profiles
                </code>
                . לשיוך מנהל יש לעדכן את{" "}
                <code className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-[11px] text-foreground/85 ring-1 ring-border/50">
                  profiles.tenant_id
                </code>{" "}
                או להשתמש בזרימת ההזמנה שלכם.
              </p>
            </details>
          </div>
        </div>

        <div className="relative mt-10 sm:mt-12">
          <div
            className="pointer-events-none absolute -inset-px rounded-[1.35rem] bg-gradient-to-br from-primary/45 via-violet-500/25 to-sky-500/30 opacity-80 blur-sm"
            aria-hidden
          />
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[0_28px_56px_-24px_rgba(15,23,42,0.35)] ring-1 ring-black/[0.04] dark:border-border/50 dark:shadow-black/40 dark:ring-white/[0.06]">
            <div className="h-1.5 bg-gradient-to-l from-sky-500 via-primary to-violet-500" />
            <AddBusinessForm
              embedded
              showHeader={false}
              appearance="premium"
              afterCreate="buildings"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
