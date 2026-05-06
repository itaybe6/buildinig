export default function DashboardLoading() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground"
        aria-hidden
      />
      <p className="text-sm text-muted-foreground">טוען…</p>
    </div>
  );
}
