import { cn } from "@my-project/ui-web";

/**
 * מסך טעינה שמחקה את מבנה ה-DashboardShell — מוצג מיד בזמן Suspense
 * של ה-layout הפנימי (Next לא מציג loading.tsx על await ב-layout עצמו).
 */
export function DashboardShellFallback({
  contentDir,
}: {
  contentDir: "rtl" | "ltr";
}) {
  const shellDirection =
    contentDir === "rtl" ? "flex-row" : "flex-row-reverse";

  return (
    <div className={cn("flex min-h-screen animate-pulse", shellDirection)}>
      <aside className="hidden min-h-0 w-60 shrink-0 flex-col border-e bg-muted/40 p-4 md:flex">
        <div className="mb-5 flex items-center gap-3 border-b border-border/60 pb-4">
          <div className="h-11 w-11 shrink-0 rounded-xl border bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted/70" />
          </div>
        </div>
        <div className="mb-6 space-y-2 px-2">
          <div className="h-3 w-16 rounded bg-muted/70" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
        <nav className="min-h-0 flex-1 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 rounded-md bg-muted/60" />
          ))}
        </nav>
        <div className="mt-4 border-t pt-4">
          <div className="h-9 w-full rounded-md bg-muted/50" />
        </div>
      </aside>
      <div className="flex min-h-screen min-h-0 flex-1 flex-col overflow-auto">
        <div className="flex h-14 items-center border-b bg-muted/30 px-4 md:hidden">
          <div className="h-8 w-8 rounded-md bg-muted" />
        </div>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="h-8 w-48 max-w-full rounded-md bg-muted" />
          <div className="h-4 w-72 max-w-full rounded bg-muted/70" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="h-28 rounded-lg border bg-card" />
            <div className="h-28 rounded-lg border bg-card" />
          </div>
        </div>
      </div>
    </div>
  );
}
