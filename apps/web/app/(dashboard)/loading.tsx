/** שלד לתוכן העמוד בלבד — ה-shell כבר מוצג מה-layout */
export default function DashboardLoading() {
  return (
    <div
      className="space-y-6 animate-pulse"
      role="status"
      aria-live="polite"
    >
      <div className="space-y-2">
        <div className="h-8 w-44 max-w-full rounded-md bg-muted" />
        <div className="h-4 w-64 max-w-full rounded bg-muted/70" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg border bg-card" />
        ))}
      </div>
      <div className="h-48 rounded-lg border bg-muted/30" />
    </div>
  );
}
